from __future__ import annotations

from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_current_admin
from app.db.session import get_db
from app.models.models import (
    AttendanceRecord, AttendanceSession, Course,
    Enrollment, FaceEmbedding, Instructor, Student, User,
)
from app.schemas.schemas import MessageResponse, UserOut

router = APIRouter()


@router.get("/users", response_model=List[UserOut])
def list_users(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
) -> List[UserOut]:
    return db.query(User).all()  # type: ignore[return-value]


@router.patch("/users/{user_id}/activate", response_model=UserOut)
def activate_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
) -> UserOut:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = True
    db.commit()
    db.refresh(user)
    return user  # type: ignore[return-value]


@router.patch("/users/{user_id}/deactivate", response_model=UserOut)
def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
) -> UserOut:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = False
    db.commit()
    db.refresh(user)
    return user  # type: ignore[return-value]


@router.delete("/students/{student_id}/embeddings", response_model=MessageResponse)
def delete_student_embeddings(
    student_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
) -> MessageResponse:
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    db.query(FaceEmbedding).filter(FaceEmbedding.student_id == student_id).delete()
    student.face_enrolled = False
    student.enrollment_consent = False
    db.commit()
    return MessageResponse(message=f"All embeddings deleted for student {student_id}")


@router.get("/stats")
def system_stats(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
) -> Dict[str, Any]:
    return {
        "total_users": db.query(User).count(),
        "total_students": db.query(Student).count(),
        "total_instructors": db.query(Instructor).count(),
        "total_courses": db.query(Course).count(),
        "total_sessions": db.query(AttendanceSession).count(),
        "total_attendance_records": db.query(AttendanceRecord).count(),
        "total_enrollments": db.query(Enrollment).count(),
    }
