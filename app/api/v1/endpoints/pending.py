from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.deps import get_current_student
from app.core.security import verify_qr_token
from app.db.session import get_db
from app.models.models import (
    AttendanceRecord, AttendanceSession, Enrollment,
    PendingAttendance, PendingAttendanceStatus, SessionStatus, Student, User,
)
from app.schemas.schemas import NotifyInstructorPayload, PendingAttendanceOut

router = APIRouter()


@router.post("/notify-instructor", response_model=PendingAttendanceOut, status_code=201)
def notify_instructor(
    payload: NotifyInstructorPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_student),
) -> PendingAttendanceOut:
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    # Resolve session_id from explicit field or qr_token
    session_id = payload.session_id
    if session_id is None and payload.qr_token:
        qr_payload = verify_qr_token(payload.qr_token)
        if not qr_payload:
            raise HTTPException(status_code=400, detail="Invalid or expired QR token")
        session_id = qr_payload.get("session_id")
    if session_id is None:
        raise HTTPException(status_code=400, detail="session_id or qr_token is required")

    session = db.query(AttendanceSession).filter(
        AttendanceSession.id == session_id,
        AttendanceSession.status == SessionStatus.active,
    ).first()
    if not session:
        raise HTTPException(status_code=400, detail="Session not found or not active")
    enrolled = db.query(Enrollment).filter(
        Enrollment.student_id == student.id,
        Enrollment.course_id == session.course_id,
    ).first()
    if not enrolled:
        raise HTTPException(status_code=403, detail="You are not enrolled in this course")
    existing_record = db.query(AttendanceRecord).filter(
        AttendanceRecord.session_id == session.id,
        AttendanceRecord.student_id == student.id,
    ).first()
    if existing_record:
        raise HTTPException(status_code=409, detail="Attendance already recorded for this session")
    existing_pending = db.query(PendingAttendance).filter(
        PendingAttendance.session_id == session.id,
        PendingAttendance.student_id == student.id,
    ).first()
    if existing_pending:
        raise HTTPException(status_code=409, detail="Notification already sent for this session")
    pending = PendingAttendance(
        session_id=session.id,
        student_id=student.id,
        reason=payload.reason,
        note=payload.note,
        status=PendingAttendanceStatus.pending,
    )
    db.add(pending)
    db.commit()
    db.refresh(pending)
    return PendingAttendanceOut(
        id=pending.id,
        session_id=pending.session_id,
        student_id=pending.student_id,
        student_name=current_user.full_name,
        student_number=student.student_number,
        reason=pending.reason,
        note=pending.note,
        status=pending.status,
        created_at=pending.created_at,
    )