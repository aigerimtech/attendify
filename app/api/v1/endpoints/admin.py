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
    users = db.query(User).all()
    result = []
    for user in users:
        out = UserOut.model_validate(user)
        student = db.query(Student).filter(Student.user_id == user.id).first()
        if student:
            out.face_enrolled = student.face_enrolled
            out.student_number = student.student_number
            out.department = student.department
        instructor = db.query(Instructor).filter(Instructor.user_id == user.id).first()
        if instructor:
            out.department = instructor.department
            out.title = instructor.title
            out.instructor_id = instructor.id
        result.append(out)
    return result


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

    # Manually delete related records to avoid FK constraint issues
    from app.models.models import (
        FaceEmbedding, Student, Instructor, Enrollment, AttendanceRecord,
        PendingAttendance,
    )
    from sqlalchemy import text

    # Delete notification_preferences and password_reset_tokens via raw SQL
    db.execute(text("DELETE FROM notification_preferences WHERE user_id = :uid"), {"uid": user_id})
    db.execute(text("DELETE FROM password_reset_tokens WHERE user_id = :uid"), {"uid": user_id})
    db.execute(text("DELETE FROM system_configs WHERE user_id = :uid"), {"uid": user_id})

    # Delete student-related data
    student = db.query(Student).filter(Student.user_id == user_id).first()
    if student:
        db.execute(text("DELETE FROM face_embeddings WHERE student_id = :sid"), {"sid": student.id})
        db.execute(text("DELETE FROM attendance_records WHERE student_id = :sid"), {"sid": student.id})
        db.execute(text("DELETE FROM pending_attendances WHERE student_id = :sid"), {"sid": student.id})
        db.execute(text("DELETE FROM enrollments WHERE student_id = :sid"), {"sid": student.id})
        db.execute(text("DELETE FROM students WHERE id = :sid"), {"sid": student.id})

    # Delete instructor
    db.execute(text("DELETE FROM instructors WHERE user_id = :uid"), {"uid": user_id})

    db.execute(text("DELETE FROM users WHERE id = :uid"), {"uid": user_id})
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


from pydantic import BaseModel, EmailStr
from typing import Optional as Opt

class AdminEditUserPayload(BaseModel):
    first_name: Opt[str] = None
    last_name: Opt[str] = None
    email: Opt[EmailStr] = None
    department: Opt[str] = None
    title: Opt[str] = None          # instructor only
    student_number: Opt[str] = None # student only
    new_password: Opt[str] = None


@router.patch("/users/{user_id}/edit", response_model=UserOut)
def edit_user(
    user_id: int,
    payload: AdminEditUserPayload,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
) -> UserOut:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.first_name is not None:
        user.first_name = payload.first_name
    if payload.last_name is not None:
        user.last_name = payload.last_name
    if payload.email is not None:
        existing = db.query(User).filter(User.email == payload.email, User.id != user_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
        user.email = payload.email
    if payload.new_password is not None and payload.new_password.strip():
        from app.core.security import get_password_hash
        user.hashed_password = get_password_hash(payload.new_password)

    # Student-specific fields
    if payload.student_number is not None or payload.department is not None:
        student = db.query(Student).filter(Student.user_id == user_id).first()
        if student:
            if payload.student_number is not None:
                student.student_number = payload.student_number
            if payload.department is not None:
                student.department = payload.department

    # Instructor-specific fields
    if payload.title is not None or (payload.department is not None and not db.query(Student).filter(Student.user_id == user_id).first()):
        instructor = db.query(Instructor).filter(Instructor.user_id == user_id).first()
        if instructor:
            if payload.title is not None:
                instructor.title = payload.title
            if payload.department is not None:
                instructor.department = payload.department

    db.commit()
    db.refresh(user)

    # Return enriched UserOut
    out = UserOut.model_validate(user)
    student = db.query(Student).filter(Student.user_id == user_id).first()
    if student:
        out.face_enrolled = student.face_enrolled
        out.student_number = student.student_number
        out.department = student.department
    instructor = db.query(Instructor).filter(Instructor.user_id == user_id).first()
    if instructor:
        out.department = instructor.department
        out.title = instructor.title
        out.instructor_id = instructor.id
    return out