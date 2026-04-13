from __future__ import annotations
from datetime import datetime, date
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.deps import get_current_instructor, get_current_student, get_current_user
from app.db.session import get_db
from app.models.models import (
    AttendanceRecord, AttendanceSession, Course, CourseSchedule,
    DayOfWeek, Enrollment, Instructor, SessionStatus, Student, User, UserRole,
)
from app.schemas.schemas import (
    MessageResponse, ScheduleSlotOut, SetSchedulePayload,
    SetScheduleResponse, StudentScheduleItem,
)

router = APIRouter()

DAY_ORDER = ["monday","tuesday","wednesday","thursday","friday"]

def _today_name() -> str:
    return date.today().strftime("%A").lower()

def _get_instructor(user: User, db: Session) -> Instructor:
    inst = db.query(Instructor).filter(Instructor.user_id == user.id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Instructor profile not found")
    return inst

@router.post("/courses/{course_id}/schedule", response_model=SetScheduleResponse, status_code=201)
def set_course_schedule(course_id: int, payload: SetSchedulePayload,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_instructor)) -> SetScheduleResponse:
    instructor = _get_instructor(current_user, db)
    course = db.query(Course).filter(Course.id == course_id, Course.instructor_id == instructor.id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    for slot in payload.schedule:
        if slot.start_time >= slot.end_time:
            raise HTTPException(status_code=400, detail=f"End time must be after start time for {slot.day_of_week}")
    db.query(CourseSchedule).filter(CourseSchedule.course_id == course_id).delete()
    new_slots = []
    for slot in payload.schedule:
        s = CourseSchedule(course_id=course_id, day_of_week=slot.day_of_week,
            start_time=slot.start_time, end_time=slot.end_time, room=slot.room)
        db.add(s)
        new_slots.append(s)
    db.commit()
    for s in new_slots:
        db.refresh(s)
    return SetScheduleResponse(message="Schedule set successfully",
        slots=[ScheduleSlotOut.model_validate(s) for s in new_slots])

@router.get("/courses/{course_id}/schedule", response_model=List[ScheduleSlotOut])
def get_course_schedule(course_id: int, db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)) -> List[ScheduleSlotOut]:
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    slots = db.query(CourseSchedule).filter(CourseSchedule.course_id == course_id).all()
    return [ScheduleSlotOut.model_validate(s) for s in slots]

@router.get("/students/me/schedule", response_model=List[StudentScheduleItem])
def get_student_schedule(week_offset: int = 0, db: Session = Depends(get_db),
    current_user: User = Depends(get_current_student)) -> List[StudentScheduleItem]:
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    enrollments = db.query(Enrollment).filter(Enrollment.student_id == student.id).all()
    today = _today_name()
    result = []
    for enr in enrollments:
        course = enr.course
        slots = db.query(CourseSchedule).filter(CourseSchedule.course_id == course.id).all()
        instructor_name = None
        if course.instructor:
            instructor_name = course.instructor.user.full_name
        for slot in slots:
            session_id = None
            session_status = None
            if slot.day_of_week.value == today:
                active_session = db.query(AttendanceSession).filter(
                    AttendanceSession.course_id == course.id,
                    AttendanceSession.status == SessionStatus.active,
                ).first()
                if active_session:
                    session_id = active_session.id
                    existing = db.query(AttendanceRecord).filter(
                        AttendanceRecord.session_id == active_session.id,
                        AttendanceRecord.student_id == student.id,
                    ).first()
                    session_status = "completed" if existing else "active"
                else:
                    closed_today = db.query(AttendanceSession).filter(
                        AttendanceSession.course_id == course.id,
                        AttendanceSession.status == SessionStatus.closed,
                    ).order_by(AttendanceSession.ended_at.desc()).first()
                    if closed_today:
                        session_id = closed_today.id
                        session_status = "completed"
                    else:
                        session_status = "upcoming"
            result.append(StudentScheduleItem(
                course_id=course.id, course_code=course.code, course_name=course.name,
                instructor_name=instructor_name, day_of_week=slot.day_of_week.value,
                start_time=slot.start_time, end_time=slot.end_time, room=slot.room,
                session_id=session_id, session_status=session_status,
            ))
    result.sort(key=lambda x: (DAY_ORDER.index(x.day_of_week) if x.day_of_week in DAY_ORDER else 9, x.start_time))
    return result

@router.get("/students/me/dashboard")
def get_student_dashboard(db: Session = Depends(get_db),
    current_user: User = Depends(get_current_student)):
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    today = _today_name()
    enrollments = db.query(Enrollment).filter(Enrollment.student_id == student.id).all()
    today_slots = []
    for enr in enrollments:
        slots = db.query(CourseSchedule).filter(
            CourseSchedule.course_id == enr.course_id,
            CourseSchedule.day_of_week == today,
        ).all()
        today_slots.extend(slots)
    all_records = db.query(AttendanceRecord).filter(
        AttendanceRecord.student_id == student.id).order_by(
        AttendanceRecord.submitted_at.desc()).limit(5).all()
    recent = []
    for r in all_records:
        recent.append({
            "session_id": r.session_id,
            "course_code": r.session.course.code if r.session else None,
            "course_name": r.session.course.name if r.session else None,
            "status": r.status.value,
            "submitted_at": r.submitted_at.isoformat() if r.submitted_at else None,
        })
    total_sessions = 0
    attended = 0
    for enr in enrollments:
        s_count = db.query(AttendanceSession).filter(AttendanceSession.course_id == enr.course_id).count()
        a_count = db.query(AttendanceRecord).join(AttendanceSession).filter(
            AttendanceSession.course_id == enr.course_id,
            AttendanceRecord.student_id == student.id,
            AttendanceRecord.face_validated == True,
        ).count()
        total_sessions += s_count
        attended += a_count
    rate = round(attended / total_sessions * 100, 1) if total_sessions > 0 else 0.0
    next_class = None
    if today_slots:
        s = today_slots[0]
        course = db.query(Course).filter(Course.id == s.course_id).first()
        next_class = {
            "course_id": course.id, "course_code": course.code,
            "course_name": course.name, "start_time": s.start_time,
            "end_time": s.end_time, "room": s.room,
        }
    return {
        "student": {
            "id": current_user.id, "full_name": current_user.full_name,
            "email": current_user.email, "student_number": student.student_number,
            "face_enrolled": student.face_enrolled, "department": student.department,
        },
        "today_class_count": len(today_slots),
        "overall_attendance_rate": rate,
        "recent_activity": recent,
        "next_class": next_class,
    }
