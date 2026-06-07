from __future__ import annotations
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.deps import get_current_instructor, get_current_user
from app.db.session import get_db
from app.models.models import (
    AttendanceRecord, AttendanceSession, Course, CourseSchedule, DayOfWeek,
    Enrollment, Instructor, Student, User, UserRole,
)
from app.schemas.schemas import (
    CourseCreate, CourseOut, CourseUpdate, CourseWithInstructor, EnrollmentCreate,
    EnrollmentOut, MessageResponse, ScheduleSlotOut, SetSchedulePayload, SetScheduleResponse,
)

router = APIRouter()

def _get_instructor(user: User, db: Session) -> Instructor:
    inst = db.query(Instructor).filter(Instructor.user_id == user.id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Instructor profile not found")
    return inst

@router.post("", response_model=CourseOut, status_code=201)
def create_course(payload: CourseCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_instructor)) -> CourseOut:
    if db.query(Course).filter(Course.code == payload.code).first():
        raise HTTPException(status_code=400, detail="Course code already exists")
    instructor = _get_instructor(current_user, db)
    course = Course(code=payload.code, name=payload.name, description=payload.description, instructor_id=instructor.id)
    db.add(course)
    db.commit()
    db.refresh(course)
    return course  # type: ignore[return-value]

@router.get("", response_model=List[CourseOut])
def list_my_courses(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> List[CourseOut]:
    if current_user.role in (UserRole.instructor, UserRole.admin):
        instructor = db.query(Instructor).filter(Instructor.user_id == current_user.id).first()
        if not instructor:
            return []
        return db.query(Course).filter(Course.instructor_id == instructor.id, Course.is_active == True).all()  # type: ignore[return-value]
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        return []
    enr = db.query(Enrollment).filter(Enrollment.student_id == student.id).all()
    ids = [e.course_id for e in enr]
    return db.query(Course).filter(Course.id.in_(ids), Course.is_active == True).all()  # type: ignore[return-value]

@router.get("/{course_id}", response_model=CourseWithInstructor)
def get_course(course_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> CourseWithInstructor:
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course  # type: ignore[return-value]

@router.patch("/{course_id}", response_model=CourseOut)
def update_course(course_id: int, payload: CourseUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_instructor)) -> CourseOut:
    instructor = _get_instructor(current_user, db)
    course = db.query(Course).filter(Course.id == course_id, Course.instructor_id == instructor.id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if payload.code is not None and payload.code != course.code:
        if db.query(Course).filter(Course.code == payload.code, Course.id != course_id).first():
            raise HTTPException(status_code=400, detail="Course code already exists")
        course.code = payload.code
    if payload.name is not None:
        course.name = payload.name
    if payload.description is not None:
        course.description = payload.description
    if payload.is_active is not None:
        course.is_active = payload.is_active
    db.commit()
    db.refresh(course)
    return course  # type: ignore[return-value]

@router.delete("/{course_id}", response_model=MessageResponse)
def delete_course(course_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_instructor)) -> MessageResponse:
    instructor = _get_instructor(current_user, db)
    course = db.query(Course).filter(Course.id == course_id, Course.instructor_id == instructor.id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    course.is_active = False
    db.commit()
    return MessageResponse(message="Course deleted successfully")

@router.get("/{course_id}/stats")
def get_course_stats(course_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_instructor)):
    instructor = _get_instructor(current_user, db)
    course = db.query(Course).filter(Course.id == course_id, Course.instructor_id == instructor.id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    student_count = db.query(Enrollment).filter(Enrollment.course_id == course_id).count()
    session_count = db.query(AttendanceSession).filter(AttendanceSession.course_id == course_id).count()
    if session_count == 0 or student_count == 0:
        attendance_rate = None
    else:
        attended = db.query(AttendanceRecord).join(
            AttendanceSession, AttendanceRecord.session_id == AttendanceSession.id
        ).filter(
            AttendanceSession.course_id == course_id,
            AttendanceRecord.face_validated == True,
            AttendanceRecord.qr_validated == True,
        ).count()
        attendance_rate = round(attended / (student_count * session_count), 2)
    return {"student_count": student_count, "session_count": session_count, "attendance_rate": attendance_rate}

@router.post("/{course_id}/enroll", response_model=EnrollmentOut, status_code=201)
def enroll_student(course_id: int, payload: EnrollmentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_instructor)) -> EnrollmentOut:
    instructor = _get_instructor(current_user, db)
    course = db.query(Course).filter(Course.id == course_id, Course.instructor_id == instructor.id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if payload.student_number:
        student = db.query(Student).filter(Student.student_number == payload.student_number).first()
    elif payload.student_id is not None:
        student = db.query(Student).filter(Student.id == payload.student_id).first()
    else:
        raise HTTPException(status_code=422, detail="Provide student_id or student_number")
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    if db.query(Enrollment).filter(Enrollment.student_id == student.id, Enrollment.course_id == course_id).first():
        raise HTTPException(status_code=409, detail="Student already enrolled")
    enrollment = Enrollment(student_id=student.id, course_id=course_id)
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    return enrollment  # type: ignore[return-value]

@router.delete("/{course_id}/enroll/{student_id}", response_model=MessageResponse)
def unenroll_student(course_id: int, student_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_instructor)) -> MessageResponse:
    instructor = _get_instructor(current_user, db)
    course = db.query(Course).filter(Course.id == course_id, Course.instructor_id == instructor.id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    enrollment = db.query(Enrollment).filter(Enrollment.student_id == student_id, Enrollment.course_id == course_id).first()
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    db.delete(enrollment)
    db.commit()
    return MessageResponse(message="Student unenrolled successfully")

@router.get("/{course_id}/students")
def list_course_students(course_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_instructor)) -> List[Dict[str, Any]]:
    instructor = _get_instructor(current_user, db)
    course = db.query(Course).filter(Course.id == course_id, Course.instructor_id == instructor.id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    enrollments = db.query(Enrollment).filter(Enrollment.course_id == course_id).all()
    total_sessions = db.query(AttendanceSession).filter(AttendanceSession.course_id == course_id).count()
    result = []
    for e in enrollments:
        attended = (
            db.query(AttendanceRecord)
            .join(AttendanceSession, AttendanceRecord.session_id == AttendanceSession.id)
            .filter(
                AttendanceSession.course_id == course_id,
                AttendanceRecord.student_id == e.student.id,
                AttendanceRecord.face_validated == True,
                AttendanceRecord.qr_validated == True,
            )
            .count()
        )
        attendance_rate = (attended / total_sessions) if total_sessions > 0 else 0.0
        result.append({
            "student_id": e.student.id,
            "student_number": e.student.student_number,
            "full_name": e.student.user.full_name,
            "email": e.student.user.email,
            "face_enrolled": e.student.face_enrolled,
            "attendance_rate": round(attendance_rate, 2),
            "attended_sessions": attended,
            "total_sessions": total_sessions,
        })
    return result

@router.get("/{course_id}/students/search")
def search_students_for_course(
    course_id: int,
    q: str = Query("", min_length=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_instructor),
) -> List[Dict[str, Any]]:
    """Search all students by name or student number, indicating if already enrolled."""
    _get_instructor(current_user, db)
    enrolled_ids = {e.student_id for e in db.query(Enrollment).filter(Enrollment.course_id == course_id).all()}
    query = db.query(Student).join(User, Student.user_id == User.id)
    if q:
        term = f"%{q}%"
        query = query.filter(
            User.first_name.ilike(term) |
            User.last_name.ilike(term) |
            Student.student_number.ilike(term)
        )
    students = query.limit(20).all()
    return [
        {
            "student_id": s.id,
            "student_number": s.student_number,
            "full_name": s.user.full_name,
            "email": s.user.email,
            "already_enrolled": s.id in enrolled_ids,
        }
        for s in students
    ]

@router.post("/{course_id}/schedule", response_model=SetScheduleResponse, status_code=201)
def set_course_schedule(course_id: int, payload: SetSchedulePayload, db: Session = Depends(get_db), current_user: User = Depends(get_current_instructor)) -> SetScheduleResponse:
    instructor = _get_instructor(current_user, db)
    course = db.query(Course).filter(Course.id == course_id, Course.instructor_id == instructor.id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    db.query(CourseSchedule).filter(CourseSchedule.course_id == course_id).delete()
    slots = []
    for slot in payload.schedule:
        s = CourseSchedule(course_id=course_id, day_of_week=slot.day_of_week,
                           start_time=slot.start_time, end_time=slot.end_time, room=slot.room)
        db.add(s)
        slots.append(s)
    db.commit()
    for s in slots:
        db.refresh(s)
    return SetScheduleResponse(message="Schedule set successfully", slots=slots)  # type: ignore[arg-type]

@router.get("/{course_id}/schedule", response_model=List[ScheduleSlotOut])
def get_course_schedule(course_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> List[ScheduleSlotOut]:
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return db.query(CourseSchedule).filter(CourseSchedule.course_id == course_id).all()  # type: ignore[return-value]