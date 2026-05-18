"""
Quick seed script for Attendify development.
Run once: python seed.py

Creates:
  - 1 admin: admin@test.com / admin123
  - 1 instructor: hoca@test.com / hoca123
  - 3 students: ali@test.com, ayse@test.com, mehmet@test.com / 123456
  - 2 courses: CS101, CS201
  - schedules + enrollments

Safe to re-run: skips records that already exist (by email/code).
"""
from __future__ import annotations
import sys
from app.db.session import SessionLocal
from app.core.security import get_password_hash
from app.models.models import (
    User, Student, Instructor, Course, CourseSchedule, Enrollment,
    UserRole, DayOfWeek,
)


def get_or_create_user(db, *, email, password, first_name, last_name, role):
    user = db.query(User).filter(User.email == email).first()
    if user:
        print(f"  ~ user exists: {email}")
        return user
    user = User(
        email=email,
        hashed_password=get_password_hash(password),
        first_name=first_name,
        last_name=last_name,
        role=role,
        is_active=True,
    )
    db.add(user)
    db.flush()
    print(f"  + user: {email} ({role.value})")
    return user


def get_or_create_instructor(db, user, *, department, title):
    inst = db.query(Instructor).filter(Instructor.user_id == user.id).first()
    if inst:
        return inst
    inst = Instructor(user_id=user.id, department=department, title=title)
    db.add(inst)
    db.flush()
    return inst


def get_or_create_student(db, user, *, student_number, department):
    st = db.query(Student).filter(Student.user_id == user.id).first()
    if st:
        return st
    st = Student(
        user_id=user.id,
        student_number=student_number,
        department=department,
        face_enrolled=False,
        enrollment_consent=True,
    )
    db.add(st)
    db.flush()
    return st


def get_or_create_course(db, *, code, name, description, instructor):
    c = db.query(Course).filter(Course.code == code).first()
    if c:
        print(f"  ~ course exists: {code}")
        return c
    c = Course(
        code=code, name=name, description=description,
        instructor_id=instructor.id, is_active=True,
    )
    db.add(c)
    db.flush()
    print(f"  + course: {code}")
    return c


def add_schedule(db, course, day, start, end, room):
    exists = db.query(CourseSchedule).filter(
        CourseSchedule.course_id == course.id,
        CourseSchedule.day_of_week == day,
        CourseSchedule.start_time == start,
    ).first()
    if exists:
        return
    db.add(CourseSchedule(
        course_id=course.id, day_of_week=day,
        start_time=start, end_time=end, room=room,
    ))


def add_enrollment(db, student, course):
    exists = db.query(Enrollment).filter(
        Enrollment.student_id == student.id,
        Enrollment.course_id == course.id,
    ).first()
    if exists:
        return
    db.add(Enrollment(student_id=student.id, course_id=course.id))


def main():
    db = SessionLocal()
    try:
        print("Seeding admin...")
        get_or_create_user(
            db, email="admin@test.com", password="admin123",
            first_name="System", last_name="Admin", role=UserRole.admin,
        )

        print("Seeding instructor...")
        hoca_user = get_or_create_user(
            db, email="hoca@test.com", password="hoca123",
            first_name="Ali", last_name="Hoca", role=UserRole.instructor,
        )
        hoca = get_or_create_instructor(
            db, hoca_user, department="Computer Engineering", title="Dr.",
        )

        print("Seeding students...")
        students_data = [
            ("ali@test.com",    "123456", "Ali",    "Yilmaz",   "20210001", "Computer Engineering"),
            ("ayse@test.com",   "123456", "Ayse",   "Demir",    "20210002", "Computer Engineering"),
            ("mehmet@test.com", "123456", "Mehmet", "Kaya",     "20210003", "Computer Engineering"),
        ]
        students = []
        for email, pw, fn, ln, num, dep in students_data:
            u = get_or_create_user(
                db, email=email, password=pw, first_name=fn, last_name=ln,
                role=UserRole.student,
            )
            s = get_or_create_student(db, u, student_number=num, department=dep)
            students.append(s)

        print("Seeding courses...")
        cs101 = get_or_create_course(
            db, code="CS101", name="Introduction to Programming",
            description="Python basics", instructor=hoca,
        )
        cs201 = get_or_create_course(
            db, code="CS201", name="Data Structures",
            description="Trees, graphs, hash tables", instructor=hoca,
        )

        print("Seeding schedules...")
        add_schedule(db, cs101, DayOfWeek.monday,    "09:00", "11:00", "A101")
        add_schedule(db, cs101, DayOfWeek.wednesday, "09:00", "11:00", "A101")
        add_schedule(db, cs201, DayOfWeek.tuesday,   "13:00", "15:00", "B205")
        add_schedule(db, cs201, DayOfWeek.thursday,  "13:00", "15:00", "B205")

        print("Seeding enrollments...")
        for s in students:
            add_enrollment(db, s, cs101)
            add_enrollment(db, s, cs201)

        db.commit()
        print("\nDone.")
        print("\nLogin credentials:")
        print("  Admin:      admin@test.com / admin123")
        print("  Instructor: hoca@test.com / hoca123")
        print("  Students:   ali@test.com / ayse@test.com / mehmet@test.com  (all: 123456)")
    except Exception as e:
        db.rollback()
        print(f"\nERROR: {e}", file=sys.stderr)
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()