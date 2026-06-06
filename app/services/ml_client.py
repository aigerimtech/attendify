from __future__ import annotations

import math
from typing import List, Optional

import httpx
from fastapi import HTTPException, status

from app.core.config import settings


class MLServiceClient:
    def __init__(self) -> None:
        self.base_url = settings.ML_SERVICE_URL
        self.timeout = 30.0

    def _ml_enabled(self) -> bool:
        return getattr(settings, "ML_SERVICE_ENABLED", True)

    async def extract_embedding(self, image_bytes: bytes) -> Optional[List[float]]:
        """
        Send image to ML service, receive face embedding vector.
        Returns None if no face detected.
        If ML_SERVICE_ENABLED=False, returns a dummy 128-d vector for testing.
        """
        if not self._ml_enabled():
            # Return deterministic dummy embedding for demo/testing
            dummy = [0.1] * 128
            return dummy

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/embed",
                    files={"image": ("capture.jpg", image_bytes, "image/jpeg")},
                )
                if response.status_code == 200:
                    return response.json().get("embedding")
                if response.status_code == 422:
                    return None
                response.raise_for_status()
                return None
        except httpx.TimeoutException:
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="Face recognition service timed out",
            )
        except httpx.RequestError:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Face recognition service unavailable",
            )

    async def compare_embeddings(
        self,
        query_embedding: List[float],
        reference_embeddings: List[List[float]],
    ) -> float:
        """
        Compute max cosine similarity between query and reference embeddings.
        Returns similarity score in [0, 1].
        If ML_SERVICE_ENABLED=False, returns 1.0 (always match) for testing.
        """
        if not self._ml_enabled():
            return 1.0

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/compare",
                    json={"query": query_embedding, "references": reference_embeddings},
                )
                response.raise_for_status()
                return float(response.json()["similarity"])
        except httpx.RequestError:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Face recognition service unavailable",
            )

    async def check_liveness(self, image_bytes: bytes, client_key: str = "default") -> dict:
        """Anti-spoofing liveness check. Returns dict with is_live and reason."""
        if not self._ml_enabled():
            return {"is_live": True, "reason": "disabled"}

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/liveness?client_key={client_key}",
                    files={"image": ("capture.jpg", image_bytes, "image/jpeg")},
                )
                if response.status_code == 200:
                    data = response.json()
                    return {"is_live": bool(data.get("is_live", False)), "reason": data.get("reason", "unknown")}
                return {"is_live": False, "reason": "service_error"}
        except httpx.RequestError:
            return {"is_live": True, "reason": "fail_open"}


ml_client = MLServiceClient()

