from __future__ import annotations
import httpx
from typing import List, Optional
from app.core.config import settings


class MLClient:
    def __init__(self, base_url: str, enabled: bool = True):
        self.base_url = base_url.rstrip("/")
        self.enabled = enabled

    async def extract_embedding(self, image_bytes: bytes) -> Optional[List[float]]:
        """Extract 128-dim face embedding from image bytes."""
        if not self.enabled:
            return [0.0] * 128  # demo mode
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(
                    f"{self.base_url}/embed",
                    files={"image": ("image.jpg", image_bytes, "image/jpeg")},
                )
                if resp.status_code == 200:
                    data = resp.json()
                    return data.get("embedding")
                return None
        except Exception:
            return None

    async def compare_embeddings(
        self,
        query: List[float],
        references: List[List[float]],
    ) -> float:
        """Compare query embedding against reference embeddings. Returns similarity score."""
        if not self.enabled:
            return 1.0  # demo mode — always match
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(
                    f"{self.base_url}/compare",
                    json={"query": query, "references": references},
                )
                if resp.status_code == 200:
                    return float(resp.json().get("similarity", 0.0))
                return 0.0
        except Exception:
            return 0.0

    async def check_liveness(self, image_bytes: bytes, client_key: str = "default") -> dict:
        """Anti-spoofing liveness check. Returns dict with is_live and reason."""
        if not self.enabled:
            return {"is_live": True, "reason": "disabled"}
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(
                    f"{self.base_url}/liveness",
                    files={"image": ("image.jpg", image_bytes, "image/jpeg")},
                    params={"client_key": client_key},
                )
                if resp.status_code == 200:
                    data = resp.json()
                    return {"is_live": bool(data.get("is_live", False)), "reason": data.get("reason", "unknown")}
                return {"is_live": False, "reason": "service_error"}
        except Exception:
            return {"is_live": True, "reason": "fail_open"}  # fail open — liveness is best-effort


ml_client = MLClient(
    base_url=settings.ML_SERVICE_URL,
    enabled=settings.ML_SERVICE_ENABLED,
)