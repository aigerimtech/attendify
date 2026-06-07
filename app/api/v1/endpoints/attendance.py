from __future__ import annotations
import json
from typing import List
from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.deps import get_current_student, get_current_user
from app.db.session import get_db
from app.models.models import (
    AttendanceRecord, AttendanceSession, AttendanceStatus,
    Enrollment, FaceEmbedding, SessionStatus, Student, User,
)
from app.schemas.schemas import AttendanceOut, StudentAttendanceSummary
from app.services.ml_client import ml_client
from app.services.qr_service import validate_qr_token_for_session

router = APIRouter()

def _enrich(record: AttendanceRecord) -> AttendanceOut:
    out = AttendanceOut.model_validate(record)
    if record.session:
        out.session_title = record.session.title
        if record.session.course:
            out.course_id = record.session.course.id
            out.course_code = record.session.course.code
            out.course_name = record.session.course.name
    return out

@router.post("/submit", response_model=AttendanceOut, status_code=201)
async def submit_attendance(
    request: Request,
    qr_token: str = Form(...),
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_student),
) -> AttendanceOut:
    from app.core.security import verify_qr_token
    payload = verify_qr_token(qr_token)
    if not payload:
        raise HTTPException(status_code=400, detail="Invalid or expired QR code")
    session_id = payload.get("session_id")
    session = db.query(AttendanceSession).filter(
        AttendanceSession.id == session_id, AttendanceSession.status == SessionStatus.active).first()
    if not session:
        raise HTTPException(status_code=404, detail="Attendance session not found or not active")
    if not validate_qr_token_for_session(qr_token, session):
        raise HTTPException(status_code=400, detail="QR code does not match session or has expired")
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    enrolled = db.query(Enrollment).filter(
        Enrollment.student_id == student.id, Enrollment.course_id == session.course_id).first()
    if not enrolled:
        raise HTTPException(status_code=403, detail="You are not enrolled in this course")
    existing = db.query(AttendanceRecord).filter(
        AttendanceRecord.session_id == session.id, AttendanceRecord.student_id == student.id).first()
    if existing:
        raise HTTPException(status_code=409, detail="Attendance already recorded for this session")
    image_bytes = await image.read()
    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image too large (max 10 MB)")
    query_embedding = await ml_client.extract_embedding(image_bytes)
    if query_embedding is None:
        raise HTTPException(status_code=422, detail="No face detected in the submitted image")
    embeddings = db.query(FaceEmbedding).filter(
        FaceEmbedding.student_id == student.id, FaceEmbedding.is_active == True).all()
    if not embeddings:
        raise HTTPException(status_code=422,
            detail="No face embeddings enrolled. Please complete face registration first.")
    reference_vectors: List[List[float]] = []
    for emb in embeddings:
        try:
            if emb.photo_path and emb.photo_path.startswith("["):
                reference_vectors.append(json.loads(emb.photo_path))
        except Exception:
            pass
    face_validated = similarity_score = 0.0
    face_validated = False
    if reference_vectors:
        similarity_score = await ml_client.compare_embeddings(query_embedding, reference_vectors)
        face_validated = similarity_score >= settings.FACE_SIMILARITY_THRESHOLD
    if not face_validated:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Face verification failed (similarity: {similarity_score:.2f})")
    ip_address = request.client.host if request.client else None
    record = AttendanceRecord(
        session_id=session.id, student_id=student.id,
        status=AttendanceStatus.present,
        face_similarity_score=similarity_score, qr_validated=True,
        face_validated=True, ip_address=ip_address,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return _enrich(record)


@router.post("/liveness-check")
async def liveness_check(
    request: Request,
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_student),
) -> dict:
    """
    Standalone liveness check — no attendance record created.
    Returns {is_live, reason} from ML service.
    """
    client_key = request.query_params.get("client_key", str(current_user.id))
    image_bytes = await image.read()
    result = await ml_client.check_liveness(image_bytes, client_key=client_key)
    return {"is_live": result["is_live"], "reason": result["reason"]}


@router.get("/my", response_model=List[AttendanceOut])
def get_my_attendance(db: Session = Depends(get_db),
    current_user: User = Depends(get_current_student)) -> List[AttendanceOut]:
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    records = db.query(AttendanceRecord).filter(
        AttendanceRecord.student_id == student.id
    ).order_by(AttendanceRecord.submitted_at.desc()).all()
    return [_enrich(r) for r in records]

@router.get("/my/summary", response_model=List[StudentAttendanceSummary])
def get_my_attendance_summary(db: Session = Depends(get_db),
    current_user: User = Depends(get_current_student)) -> List[StudentAttendanceSummary]:
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    enrollments = db.query(Enrollment).filter(Enrollment.student_id == student.id).all()
    summaries = []
    for enrollment in enrollments:
        course = enrollment.course
        total_sessions = db.query(AttendanceSession).filter(
            AttendanceSession.course_id == course.id).count()
        attended = db.query(AttendanceRecord).join(AttendanceSession).filter(
            AttendanceSession.course_id == course.id,
            AttendanceRecord.student_id == student.id,
            AttendanceRecord.face_validated == True,
        ).count()
        summaries.append(StudentAttendanceSummary(
            course_id=course.id, course_code=course.code, course_name=course.name,
            total_sessions=total_sessions, attended=attended,
            attendance_rate=round(attended / total_sessions * 100, 1) if total_sessions > 0 else 0.0,
        ))
    return summaries