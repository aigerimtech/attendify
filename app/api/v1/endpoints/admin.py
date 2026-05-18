from __future__ import annotations

from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_current_admin, get_current_instructor
from app.db.session import get_db
from app.models.models import (
    AttendanceRecord, AttendanceSession, AttendanceStatus, Course,
    Enrollment, FaceEmbedding, Instructor, Student, User,
)
from app.schemas.schemas import MessageResponse, StudentRiskReport, UserOut

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


@router.delete("/users/{user_id}", response_model=MessageResponse)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
) -> MessageResponse:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return MessageResponse(message=f"User {user_id} deleted")


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


@router.get("/reports/at-risk", response_model=List[StudentRiskReport])
def at_risk_students(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_instructor),
) -> List[StudentRiskReport]:
    instructor = db.query(Instructor).filter(
        Instructor.user_id == current_user.id).first()
    if not instructor:
        raise HTTPException(status_code=403, detail="Instructor not found")

    course = db.query(Course).filter(
        Course.id == course_id,
        Course.instructor_id == instructor.id,
    ).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    total_sessions = db.query(AttendanceSession).filter(
        AttendanceSession.course_id == course_id).count()

    enrollments = db.query(Enrollment).filter(
        Enrollment.course_id == course_id).all()

    result = []
    for e in enrollments:
        attended = db.query(AttendanceRecord).join(AttendanceSession).filter(
            AttendanceSession.course_id == course_id,
            AttendanceRecord.student_id == e.student_id,
            AttendanceRecord.status == AttendanceStatus.present,
        ).count()

        absence_rate = 1 - (attended / total_sessions) if total_sessions > 0 else 0

        risk = (
            "critical" if absence_rate >= 0.30
            else "at-risk" if absence_rate >= 0.15
            else "present"
        )

        last_record = db.query(AttendanceRecord).join(AttendanceSession).filter(
            AttendanceSession.course_id == course_id,
            AttendanceRecord.student_id == e.student_id,
        ).order_by(AttendanceRecord.submitted_at.desc()).first()

        result.append(StudentRiskReport(
            student_id=e.student.id,
            student_number=e.student.student_number,
            full_name=e.student.user.full_name,
            email=e.student.user.email,
            absence_rate=round(absence_rate, 2),
            attended=attended,
            total_sessions=total_sessions,
            risk_level=risk,
            last_active=last_record.submitted_at if last_record else None,
        ))

    return result