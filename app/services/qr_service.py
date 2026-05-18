from __future__ import annotations

import base64
from datetime import datetime, timedelta
from io import BytesIO
from typing import Tuple

import qrcode
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_qr_token
from app.models.models import AttendanceSession, SessionStatus


def generate_qr_image(data: str) -> str:
    """Generate a QR code image and return as base64-encoded PNG string."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    return base64.b64encode(buffer.read()).decode("utf-8")


def create_session_qr(
    session: AttendanceSession,
    db: Session,
) -> Tuple[str, str, datetime]:
    """
    Generate a new QR token for a session.
    Returns (token, qr_image_base64, expires_at).
    """
    expires_delta = timedelta(minutes=settings.QR_TOKEN_EXPIRE_MINUTES)
    token = create_qr_token(session_id=session.id, expires_delta=expires_delta)
    expires_at = datetime.utcnow() + expires_delta

    qr_url = f"http://localhost:5173/student/scan?token={token}"
    qr_image_b64 = generate_qr_image(qr_url)

    session.qr_token = token
    session.qr_expires_at = expires_at
    db.commit()
    db.refresh(session)

    return token, qr_image_b64, expires_at


def renew_session_qr(
    session: AttendanceSession,
    db: Session,
) -> Tuple[str, str, datetime]:
    """Renew the QR token for an active session."""
    if session.status != SessionStatus.active:
        raise ValueError("Cannot renew QR for a non-active session")
    return create_session_qr(session, db)


def validate_qr_token_for_session(token: str, session: AttendanceSession) -> bool:
    """Validate that a QR token belongs to this session and has not expired."""
    from app.core.security import verify_qr_token
    payload = verify_qr_token(token)
    if not payload:
        return False
    if payload.get("session_id") != session.id:
        return False
    if session.status != SessionStatus.active:
        return False
    return True