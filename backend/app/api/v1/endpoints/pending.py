from __future__ import annotations
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.deps import get_current_instructor, get_current_student
from app.db.session import get_db
from app.models.models import (
    AttendanceRecord, AttendanceSession, AttendanceStatus,
    Course, Enrollment, Instructor, PendingAttendance,
    PendingAttendanceStatus, SessionStatus, Student, User,
)
from app.schemas.schemas import (
    NotifyInstructorPayload, PendingAttendanceOut,
    ResolvePendingPayload, ResolvePendingResponse,
)

router = APIRouter()

def _get_instructor(user: User, db: Session) -> Instructor:
    inst = db.query(Instructor).filter(Instructor.user_id == user.id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Instructor profile not found")
    return inst

@router.post("/attendance/notify-instructor", response_model=PendingAttendanceOut, status_code=201)
def notify_instructor(payload: NotifyInstructorPayload,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_student)) -> PendingAttendanceOut:
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    session = db.query(AttendanceSession).filter(
        AttendanceSession.id == payload.session_id,
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
        session_id=session.id, student_id=student.id,
        reason=payload.reason, note=payload.note,
        status=PendingAttendanceStatus.pending,
    )
    db.add(pending)
    db.commit()
    db.refresh(pending)
    return PendingAttendanceOut(
        id=pending.id, session_id=pending.session_id, student_id=pending.student_id,
        student_name=current_user.full_name, student_number=student.student_number,
        reason=pending.reason, note=pending.note, status=pending.status,
        created_at=pending.created_at,
    )

@router.get("/sessions/{session_id}/pending", response_model=List[PendingAttendanceOut])
def get_pending_list(session_id: int,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_instructor)) -> List[PendingAttendanceOut]:
    instructor = _get_instructor(current_user, db)
    session = db.query(AttendanceSession).join(Course).filter(
        AttendanceSession.id == session_id,
        Course.instructor_id == instructor.id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    pendings = db.query(PendingAttendance).filter(
        PendingAttendance.session_id == session_id,
        PendingAttendance.status == PendingAttendanceStatus.pending,
    ).order_by(PendingAttendance.created_at.asc()).all()
    result = []
    for p in pendings:
        result.append(PendingAttendanceOut(
            id=p.id, session_id=p.session_id, student_id=p.student_id,
            student_name=p.student.user.full_name,
            student_number=p.student.student_number,
            reason=p.reason, note=p.note, status=p.status,
            created_at=p.created_at,
        ))
    return result

@router.patch("/sessions/{session_id}/pending/{pending_id}", response_model=ResolvePendingResponse)
def resolve_pending(session_id: int, pending_id: int, payload: ResolvePendingPayload,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_instructor)) -> ResolvePendingResponse:
    instructor = _get_instructor(current_user, db)
    session = db.query(AttendanceSession).join(Course).filter(
        AttendanceSession.id == session_id,
        Course.instructor_id == instructor.id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    pending = db.query(PendingAttendance).filter(
        PendingAttendance.id == pending_id,
        PendingAttendance.session_id == session_id,
    ).first()
    if not pending:
        raise HTTPException(status_code=404, detail="Pending request not found")
    if pending.status != PendingAttendanceStatus.pending:
        raise HTTPException(status_code=400, detail="Request already resolved")
    now = datetime.now(timezone.utc)
    attendance_record_data = None
    if payload.action == "approve":
        pending.status = PendingAttendanceStatus.approved
        pending.resolved_at = now
        existing = db.query(AttendanceRecord).filter(
            AttendanceRecord.session_id == session_id,
            AttendanceRecord.student_id == pending.student_id,
        ).first()
        if existing:
            existing.status = AttendanceStatus.present
            existing.qr_validated = False
            existing.face_validated = False
            record = existing
        else:
            record = AttendanceRecord(
                session_id=session_id, student_id=pending.student_id,
                status=AttendanceStatus.present,
                qr_validated=False, face_validated=False,
            )
            db.add(record)
        db.commit()
        db.refresh(record)
        attendance_record_data = {
            "id": record.id, "session_id": record.session_id,
            "student_id": record.student_id, "status": record.status.value,
            "face_validated": record.face_validated, "qr_validated": record.qr_validated,
        }
    else:
        pending.status = PendingAttendanceStatus.declined
        pending.resolved_at = now
        db.commit()
    return ResolvePendingResponse(
        pending_id=pending.id,
        status=pending.status,
        attendance_record=attendance_record_data,
    )
