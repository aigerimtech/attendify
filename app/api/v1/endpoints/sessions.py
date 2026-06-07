from __future__ import annotations
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.deps import get_current_instructor, get_current_user
from app.db.session import get_db
from app.models.models import (
    AttendanceRecord, AttendanceSession, AttendanceStatus, Course,
    Enrollment, Instructor, PendingAttendance, PendingAttendanceStatus,
    SessionStatus, Student, User,
)
from app.schemas.schemas import (
    AttendanceOut, MessageResponse, PendingAttendanceOut,
    ResolvePendingPayload, ResolvePendingResponse,
    SessionAttendanceSummary, SessionCreate, SessionOut, SessionWithQR,
)
from app.services.qr_service import create_session_qr, renew_session_qr

router = APIRouter()

class ManualAttendancePayload(BaseModel):
    student_id: int
    note: Optional[str] = None

def _get_instructor(user: User, db: Session) -> Instructor:
    inst = db.query(Instructor).filter(Instructor.user_id == user.id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Instructor profile not found")
    return inst

@router.post("", response_model=SessionWithQR, status_code=201)
def create_session(payload: SessionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_instructor)) -> SessionWithQR:
    instructor = _get_instructor(current_user, db)
    course = db.query(Course).filter(Course.id == payload.course_id, Course.instructor_id == instructor.id, Course.is_active == True).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found or not yours")
    db.query(AttendanceSession).filter(AttendanceSession.course_id == course.id, AttendanceSession.status == SessionStatus.active).update({"status": SessionStatus.closed, "ended_at": datetime.utcnow()})
    title = payload.title or f"Session â€“ {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}"
    session = AttendanceSession(course_id=course.id, title=title, status=SessionStatus.active, created_by_id=current_user.id)
    db.add(session)
    db.commit()
    db.refresh(session)
    _token, qr_image_b64, _expires = create_session_qr(session, db)
    return SessionWithQR(
        id=session.id, course_id=session.course_id,
        course_code=course.code, course_name=course.name,
        title=session.title, status=session.status,
        qr_token=session.qr_token, qr_expires_at=session.qr_expires_at,
        started_at=session.started_at, ended_at=session.ended_at,
        qr_image_base64=qr_image_b64,
    )

@router.get("", response_model=List[SessionOut])
def list_my_sessions(db: Session = Depends(get_db), current_user: User = Depends(get_current_instructor)) -> List[SessionOut]:
    instructor = _get_instructor(current_user, db)
    sessions = (
        db.query(AttendanceSession)
        .join(Course, AttendanceSession.course_id == Course.id)
        .filter(Course.instructor_id == instructor.id)
        .order_by(AttendanceSession.started_at.desc())
        .all()
    )
    result = []
    for s in sessions:
        attended = db.query(AttendanceRecord).filter(AttendanceRecord.session_id == s.id).count()
        enrolled = db.query(Enrollment).filter(Enrollment.course_id == s.course_id).count()
        result.append(SessionOut(
            id=s.id, course_id=s.course_id,
            course_code=s.course.code, course_name=s.course.name,
            title=s.title, status=s.status,
            qr_token=s.qr_token, qr_expires_at=s.qr_expires_at,
            started_at=s.started_at, ended_at=s.ended_at,
            attended_count=attended,
            total_enrolled=enrolled,
        ))
    return result

@router.post("/{session_id}/renew-qr", response_model=SessionWithQR)
def renew_qr(session_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_instructor)) -> SessionWithQR:
    instructor = _get_instructor(current_user, db)
    session = db.query(AttendanceSession).join(Course).filter(AttendanceSession.id == session_id, Course.instructor_id == instructor.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.status != SessionStatus.active:
        raise HTTPException(status_code=400, detail="Session is not active")
    _token, qr_image_b64, _expires = renew_session_qr(session, db)
    return SessionWithQR(
        id=session.id, course_id=session.course_id,
        course_code=session.course.code, course_name=session.course.name,
        title=session.title, status=session.status,
        qr_token=session.qr_token, qr_expires_at=session.qr_expires_at,
        started_at=session.started_at, ended_at=session.ended_at,
        qr_image_base64=qr_image_b64,
    )

@router.post("/{session_id}/close", response_model=SessionOut)
def close_session(session_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_instructor)) -> SessionOut:
    instructor = _get_instructor(current_user, db)
    session = db.query(AttendanceSession).join(Course).filter(AttendanceSession.id == session_id, Course.instructor_id == instructor.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session.status = SessionStatus.closed
    session.ended_at = datetime.utcnow()
    session.qr_token = None
    db.commit()
    db.refresh(session)
    return SessionOut(
        id=session.id, course_id=session.course_id,
        course_code=session.course.code, course_name=session.course.name,
        title=session.title, status=session.status,
        qr_token=session.qr_token, qr_expires_at=session.qr_expires_at,
        started_at=session.started_at, ended_at=session.ended_at,
    )

@router.post("/{session_id}/mark-present", response_model=AttendanceOut, status_code=201)
def mark_present_manually(session_id: int, payload: ManualAttendancePayload, db: Session = Depends(get_db), current_user: User = Depends(get_current_instructor)) -> AttendanceOut:
    instructor = _get_instructor(current_user, db)
    session = db.query(AttendanceSession).join(Course).filter(AttendanceSession.id == session_id, Course.instructor_id == instructor.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    student = db.query(Student).filter(Student.id == payload.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    enrolled = db.query(Enrollment).filter(Enrollment.student_id == student.id, Enrollment.course_id == session.course_id).first()
    if not enrolled:
        raise HTTPException(status_code=403, detail="Student is not enrolled in this course")
    existing = db.query(AttendanceRecord).filter(AttendanceRecord.session_id == session.id, AttendanceRecord.student_id == student.id).first()
    if existing:
        existing.status = AttendanceStatus.present
        existing.qr_validated = True
        existing.face_validated = True
        existing.face_similarity_score = None
        db.commit()
        db.refresh(existing)
        return existing  # type: ignore[return-value]
    record = AttendanceRecord(session_id=session.id, student_id=student.id, status=AttendanceStatus.present, qr_validated=True, face_validated=True, face_similarity_score=None)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record  # type: ignore[return-value]

@router.delete("/{session_id}/mark-present/{student_id}", response_model=MessageResponse)
def remove_manual_attendance(session_id: int, student_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_instructor)) -> MessageResponse:
    instructor = _get_instructor(current_user, db)
    session = db.query(AttendanceSession).join(Course).filter(AttendanceSession.id == session_id, Course.instructor_id == instructor.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    record = db.query(AttendanceRecord).filter(AttendanceRecord.session_id == session_id, AttendanceRecord.student_id == student_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    db.delete(record)
    db.commit()
    return MessageResponse(message="Attendance record removed successfully")

@router.get("/{session_id}/pending", response_model=List[PendingAttendanceOut])
def get_pending_attendances(session_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_instructor)) -> List[PendingAttendanceOut]:
    instructor = _get_instructor(current_user, db)
    session = db.query(AttendanceSession).join(Course).filter(AttendanceSession.id == session_id, Course.instructor_id == instructor.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    pendings = db.query(PendingAttendance).filter(PendingAttendance.session_id == session_id, PendingAttendance.status == PendingAttendanceStatus.pending).order_by(PendingAttendance.created_at.asc()).all()
    return [PendingAttendanceOut(
        id=p.id, session_id=p.session_id, student_id=p.student_id,
        student_name=p.student.user.full_name, student_number=p.student.student_number,
        reason=p.reason, note=p.note, status=p.status, created_at=p.created_at,
    ) for p in pendings]

@router.patch("/{session_id}/pending/{pending_id}", response_model=ResolvePendingResponse)
def resolve_pending(session_id: int, pending_id: int, payload: ResolvePendingPayload, db: Session = Depends(get_db), current_user: User = Depends(get_current_instructor)) -> ResolvePendingResponse:
    instructor = _get_instructor(current_user, db)
    session = db.query(AttendanceSession).join(Course).filter(AttendanceSession.id == session_id, Course.instructor_id == instructor.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    pending = db.query(PendingAttendance).filter(PendingAttendance.id == pending_id, PendingAttendance.session_id == session_id).first()
    if not pending:
        raise HTTPException(status_code=404, detail="Pending attendance not found")
    if pending.status != PendingAttendanceStatus.pending:
        raise HTTPException(status_code=400, detail="This request has already been resolved")
    pending.resolved_at = datetime.utcnow()
    attendance_record_dict = None
    if payload.action == "approve":
        pending.status = PendingAttendanceStatus.approved
        existing = db.query(AttendanceRecord).filter(AttendanceRecord.session_id == session_id, AttendanceRecord.student_id == pending.student_id).first()
        if not existing:
            record = AttendanceRecord(session_id=session_id, student_id=pending.student_id, status=AttendanceStatus.present, qr_validated=False, face_validated=False, face_similarity_score=None)
            db.add(record)
            db.flush()
            attendance_record_dict = {"id": record.id, "session_id": record.session_id, "student_id": record.student_id, "status": record.status.value, "face_validated": record.face_validated, "qr_validated": record.qr_validated}
        else:
            existing.status = AttendanceStatus.present
            attendance_record_dict = {"id": existing.id, "session_id": existing.session_id, "student_id": existing.student_id, "status": existing.status.value, "face_validated": existing.face_validated, "qr_validated": existing.qr_validated}
    else:
        pending.status = PendingAttendanceStatus.declined
    db.commit()
    return ResolvePendingResponse(pending_id=pending.id, status=pending.status, attendance_record=attendance_record_dict)

@router.get("/course/{course_id}", response_model=List[SessionOut])
def list_sessions_for_course(course_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_instructor)) -> List[SessionOut]:
    instructor = _get_instructor(current_user, db)
    course = db.query(Course).filter(Course.id == course_id, Course.instructor_id == instructor.id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    sessions = db.query(AttendanceSession).filter(AttendanceSession.course_id == course_id).order_by(AttendanceSession.started_at.desc()).all()
    return [
        SessionOut(
            id=s.id, course_id=s.course_id,
            course_code=course.code, course_name=course.name,
            title=s.title, status=s.status,
            qr_token=s.qr_token, qr_expires_at=s.qr_expires_at,
            started_at=s.started_at, ended_at=s.ended_at,
        )
        for s in sessions
    ]

@router.get("/{session_id}", response_model=SessionOut)
def get_session(session_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> SessionOut:
    session = db.query(AttendanceSession).filter(AttendanceSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return SessionOut(
        id=session.id, course_id=session.course_id,
        course_code=session.course.code, course_name=session.course.name,
        title=session.title, status=session.status,
        qr_token=session.qr_token, qr_expires_at=session.qr_expires_at,
        started_at=session.started_at, ended_at=session.ended_at,
    )

@router.get("/{session_id}/attendance", response_model=SessionAttendanceSummary)
def get_session_attendance(session_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_instructor)) -> SessionAttendanceSummary:
    instructor = _get_instructor(current_user, db)
    session = db.query(AttendanceSession).join(Course).filter(AttendanceSession.id == session_id, Course.instructor_id == instructor.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    total_enrolled = db.query(Enrollment).filter(Enrollment.course_id == session.course_id).count()
    records = db.query(AttendanceRecord).filter(AttendanceRecord.session_id == session_id).all()
    total_present = sum(1 for r in records if r.face_validated or r.qr_validated)
    from app.schemas.schemas import AttendanceWithStudent, StudentOut, UserOut
    enriched = []
    for r in records:
        try:
            student = db.query(Student).filter(Student.id == r.student_id).first()
            if not student or not student.user:
                continue
            user_out = UserOut(
                id=student.user.id, email=student.user.email,
                first_name=student.user.first_name, last_name=student.user.last_name,
                role=student.user.role, is_active=student.user.is_active,
                created_at=student.user.created_at,
            )
            student_out = StudentOut(
                id=student.id, user_id=student.user_id,
                student_number=student.student_number or "",
                department=student.department, face_enrolled=student.face_enrolled,
                user=user_out,
            )
            from app.schemas.schemas import AttendanceOut
            att_out = AttendanceWithStudent(
                id=r.id, session_id=r.session_id, student_id=r.student_id,
                status=r.status, face_similarity_score=r.face_similarity_score,
                qr_validated=r.qr_validated, face_validated=r.face_validated,
                submitted_at=r.submitted_at,
                student=student_out,
            )
            enriched.append(att_out)
        except Exception as e:
            continue
    return SessionAttendanceSummary(
        session_id=session.id, session_title=session.title,
        course_code=session.course.code, course_name=session.course.name,
        started_at=session.started_at, total_enrolled=total_enrolled,
        total_present=total_present,
        attendance_rate=round(total_present / total_enrolled * 100, 1) if total_enrolled > 0 else 0.0,
        records=enriched,
    )