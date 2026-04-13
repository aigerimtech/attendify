from __future__ import annotations

import json
import os
import uuid
from typing import Dict, Any, List

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.deps import get_current_student
from app.db.session import get_db
from app.models.models import FaceEmbedding, Student, User
from app.schemas.schemas import FaceEnrollmentResult, MessageResponse
from app.services.ml_client import ml_client

router = APIRouter()


@router.post("/enroll", response_model=FaceEnrollmentResult)
async def enroll_face(
    consent: bool = Form(...),
    photos: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_student),
) -> FaceEnrollmentResult:
    """Upload 3–10 face photos to enroll in face recognition."""
    if not consent:
        raise HTTPException(status_code=400, detail="Biometric consent is required for face enrollment")

    if len(photos) < settings.MIN_FACE_PHOTOS:
        raise HTTPException(status_code=400, detail=f"Please provide at least {settings.MIN_FACE_PHOTOS} photos")
    if len(photos) > settings.MAX_FACE_PHOTOS:
        raise HTTPException(status_code=400, detail=f"Maximum {settings.MAX_FACE_PHOTOS} photos allowed")

    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    upload_dir = os.path.join(settings.UPLOAD_DIR, "faces", str(student.id))
    os.makedirs(upload_dir, exist_ok=True)

    successful = 0
    for photo in photos:
        image_bytes = await photo.read()
        if len(image_bytes) > 10 * 1024 * 1024:
            continue

        embedding = await ml_client.extract_embedding(image_bytes)
        if embedding is None:
            continue

        filename = f"{uuid.uuid4().hex}.jpg"
        photo_path = os.path.join(upload_dir, filename)
        with open(photo_path, "wb") as f:
            f.write(image_bytes)

        db.add(FaceEmbedding(
            student_id=student.id,
            photo_path=json.dumps(embedding),
            version=1,
            is_active=True,
        ))
        successful += 1

    if successful < settings.MIN_FACE_PHOTOS:
        db.rollback()
        raise HTTPException(
            status_code=422,
            detail=f"Only {successful} valid face photos detected. Need at least {settings.MIN_FACE_PHOTOS}.",
        )

    student.face_enrolled = True
    student.enrollment_consent = True
    db.commit()

    return FaceEnrollmentResult(
        success=True,
        photos_processed=successful,
        message=f"Successfully enrolled {successful} face photos.",
    )


@router.delete("/enroll", response_model=MessageResponse)
def delete_face_enrollment(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_student),
) -> MessageResponse:
    """Delete all face embeddings (re-enroll or withdraw consent)."""
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    db.query(FaceEmbedding).filter(FaceEmbedding.student_id == student.id).delete()
    student.face_enrolled = False
    student.enrollment_consent = False
    db.commit()
    return MessageResponse(message="Face enrollment data deleted successfully")


@router.get("/enroll/status")
def get_enrollment_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_student),
) -> Dict[str, Any]:
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    count = db.query(FaceEmbedding).filter(
        FaceEmbedding.student_id == student.id,
        FaceEmbedding.is_active == True,
    ).count()
    return {
        "face_enrolled": student.face_enrolled,
        "embedding_count": count,
        "consent_given": student.enrollment_consent,
    }
