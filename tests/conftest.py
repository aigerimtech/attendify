from __future__ import annotations

import os
# Must be set before any app imports so config picks up test values
os.environ["DATABASE_URL"] = "sqlite:///./test.db"
os.environ["SECRET_KEY"] = "test-secret-key-32-chars-minimum!!"
os.environ["ML_SERVICE_URL"] = "http://localhost:8001"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.session import Base, get_db
from app.core.security import get_password_hash
from app.models.models import Course, Enrollment, Instructor, Student, User, UserRole

SQLALCHEMY_TEST_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_TEST_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="session", autouse=True)
def create_tables():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    if os.path.exists("test.db"):
        os.remove("test.db")


@pytest.fixture()
def db():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture()
def client(db):
    def _override():
        yield db
    app.dependency_overrides[get_db] = _override
    with TestClient(app) as c:
        yield c
    app.dependency_overrides[get_db] = override_get_db


# ── Factories ─────────────────────────────────────────────────────────────

def make_student(
    db,
    email: str = "student@test.com",
    student_number: str = "20210001",
    password: str = "password123",
):
    user = User(
        email=email,
        hashed_password=get_password_hash(password),
        first_name="Test",
        last_name="Student",
        role=UserRole.student,
        is_active=True,
    )
    db.add(user)
    db.flush()
    student = Student(user_id=user.id, student_number=student_number)
    db.add(student)
    db.commit()
    return user, student


def make_instructor(
    db,
    email: str = "instructor@test.com",
    password: str = "password123",
):
    user = User(
        email=email,
        hashed_password=get_password_hash(password),
        first_name="Test",
        last_name="Instructor",
        role=UserRole.instructor,
        is_active=True,
    )
    db.add(user)
    db.flush()
    instructor = Instructor(user_id=user.id, department="CS")
    db.add(instructor)
    db.commit()
    return user, instructor


def make_course(db, instructor: Instructor, code: str = "CS101", name: str = "Intro to CS") -> Course:
    course = Course(code=code, name=name, instructor_id=instructor.id)
    db.add(course)
    db.commit()
    return course


def login(client: TestClient, email: str, password: str = "password123") -> str:
    resp = client.post("/api/v1/auth/login", data={"username": email, "password": password})
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    return resp.json()["access_token"]
