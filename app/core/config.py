from __future__ import annotations

from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "Attendify"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    SECRET_KEY: str = "dev-secret-key-change-in-production-min-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    DATABASE_URL: str = "postgresql://attendify:attendify@localhost:5432/attendify"

    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://172.16.1.70:5173",
        "http://172.16.1.70:5174",
        "http://172.16.1.70:3000",
        "http://172.16.1.70:8000",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
        "https://attendify-student.vercel.app",
        "https://attendify-student-tawny.vercel.app",
    ]

    QR_TOKEN_EXPIRE_MINUTES: int = 15
    QR_RENEWAL_INTERVAL_SECONDS: int = 15

    ML_SERVICE_URL: str = "http://localhost:8001"
    ML_SERVICE_ENABLED: bool = True
    FACE_SIMILARITY_THRESHOLD: float = 0.35

    UPLOAD_DIR: str = "uploads"
    MAIL_USERNAME: str = ""
    MAIL_PASSWORD: str = ""
    MAIL_FROM: str = ""
    MAIL_SERVER: str = "smtp.gmail.com"
    MAIL_PORT: int = 587
    MAIL_TLS: bool = True
    MAIL_SSL: bool = False
    MAX_FACE_PHOTOS: int = 10
    MIN_FACE_PHOTOS: int = 1

    model_config = {"env_file": ".env", "case_sensitive": True}


settings = Settings()