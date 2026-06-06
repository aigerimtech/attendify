from __future__ import annotations
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.deps import get_current_student
from app.db.session import get_db
from app.models.models import (
    AttendanceRecord, AttendanceSession, CourseSchedule,
    Enrollment, SessionStatus, Student, User,
)
from app.schemas.schemas import (
    RecentActivityItem, StudentAttendanceSummary,
    StudentDashboard, StudentScheduleItem,
)

router = APIRouter()

DAY_MAP = {"monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3, "friday": 4}

def _today_day_name() -> str:
    day = datetime.now().strftime("%A").lower()
    return day if day in ("monday","tuesday","wednesday","thursday","friday") else "monday"

def _get_session_status_for_course(course_id: int, student_id: int, db: Session) -> tuple:
    today_sessions = (
        db.query(AttendanceSession)
        .filter(AttendanceSession.course_id == course_id)
        .order_by(AttendanceSession.started_at.desc())
        .first()
    )
    if not today_sessions:
        return None, "upcoming"
    if today_sessions.status == SessionStatus.active:
        existing = db.query(AttendanceRecord).filter(
            AttendanceRecord.session_id == today_sessions.id,
            AttendanceRecord.student_id == student_id,
        ).first()
        if existing:
            return today_sessions.id, "completed"
        return today_sessions.id, "active"
    if today_sessions.status == SessionStatus.closed:
        return today_sessions.id, "completed"
    return None, "upcoming"

def _compute_risk_level(attendance_rate: float) -> str:
    if attendance_rate >= 80:
        return "ok"
    elif attendance_rate >= 60:
        return "at_risk"
    return "critical"

@router.get("/me/schedule", response_model=List[StudentScheduleItem])
def get_my_schedule(
    week_offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_student),
) -> List[StudentScheduleItem]:
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    enrollments = db.query(Enrollment).filter(Enrollment.student_id == student.id).all()
    if not enrollments:
        return []
    items = []
    today = _today_day_name()
    for enrollment in enrollments:
        course = enrollment.course
        schedules = db.query(CourseSchedule).filter(CourseSchedule.course_id == course.id).all()
        instructor_name = None
        if course.instructor and course.instructor.user:
            instructor_name = course.instructor.user.full_name
        for sched in schedules:
            session_id, session_status = _get_session_status_for_course(course.id, student.id, db)
            if sched.day_of_week.value != today:
                session_id = None
                session_status = None
            items.append(StudentScheduleItem(
                course_id=course.id,
                course_code=course.code,
                course_name=course.name,
                instructor_name=instructor_name,
                day_of_week=sched.day_of_week.value,
                start_time=sched.start_time,
                end_time=sched.end_time,
                room=sched.room,
                session_id=session_id,
                session_status=session_status,
            ))
    items.sort(key=lambda x: (DAY_MAP.get(x.day_of_week, 99), x.start_time))
    return items

@router.get("/me/dashboard", response_model=StudentDashboard)
def get_my_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_student),
) -> StudentDashboard:
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    enrollments = db.query(Enrollment).filter(Enrollment.student_id == student.id).all()
    today = _today_day_name()
    today_class_count = 0
    for enr in enrollments:
        schedules = db.query(CourseSchedule).filter(
            CourseSchedule.course_id == enr.course_id,
            CourseSchedule.day_of_week == today,
        ).count()
        today_class_count += schedules
    all_records = db.query(AttendanceRecord).filter(AttendanceRecord.student_id == student.id).all()
    total = len(all_records)
    present = sum(1 for r in all_records if r.face_validated and r.qr_validated)
    overall_rate = round(present / total * 100, 1) if total > 0 else 0.0
    recent = (
        db.query(AttendanceRecord)
        .filter(AttendanceRecord.student_id == student.id)
        .order_by(AttendanceRecord.submitted_at.desc())
        .limit(5)
        .all()
    )
    recent_activity = []
    for r in recent:
        course = r.session.course if r.session else None
        if course:
            recent_activity.append(RecentActivityItem(
                course_code=course.code,
                course_name=course.name,
                status=r.status.value,
                submitted_at=r.submitted_at,
            ))
    next_class: Optional[StudentScheduleItem] = None
    today_schedules = []
    for enr in enrollments:
        scheds = db.query(CourseSchedule).filter(
            CourseSchedule.course_id == enr.course_id,
            CourseSchedule.day_of_week == today,
        ).all()
        for s in scheds:
            sid, sstatus = _get_session_status_for_course(enr.course_id, student.id, db)
            instructor_name = None
            if enr.course.instructor and enr.course.instructor.user:
                instructor_name = enr.course.instructor.user.full_name
            today_schedules.append(StudentScheduleItem(
                course_id=enr.course_id,
                course_code=enr.course.code,
                course_name=enr.course.name,
                instructor_name=instructor_name,
                day_of_week=s.day_of_week.value,
                start_time=s.start_time,
                end_time=s.end_time,
                room=s.room,
                session_id=sid,
                session_status=sstatus,
            ))
    today_schedules.sort(key=lambda x: x.start_time)
    now_str = datetime.now().strftime("%H:%M")
    for ts in today_schedules:
        if ts.start_time >= now_str and ts.session_status != "completed":
            next_class = ts
            break
    if not next_class and today_schedules:
        next_class = today_schedules[0]
    return StudentDashboard(
        student_id=student.id,
        full_name=current_user.full_name,
        student_number=student.student_number,
        face_enrolled=student.face_enrolled,
        department=student.department,
        today_class_count=today_class_count,
        overall_attendance_rate=overall_rate,
        recent_activity=recent_activity,
        next_class=next_class,
    )

