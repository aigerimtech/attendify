from __future__ import annotations

import json
from datetime import datetime, timedelta
from typing import List
from unittest.mock import AsyncMock, patch

import pytest

from app.core.security import create_qr_token
from app.models.models import (
    AttendanceRecord, AttendanceSession, Enrollment,
    FaceEmbedding, SessionStatus,
)
from tests.conftest import login, make_course, make_instructor, make_student


def _full_setup(db):
    """Create instructor + course + active session + enrolled student + fake embeddings."""
    _, instructor = make_instructor(db)
    course = make_course(db, instructor, code="CS400")
    _, student = make_student(db)
    db.add(Enrollment(student_id=student.id, course_id=course.id))

    session = AttendanceSession(
        course_id=course.id,
        title="Test Session",
        status=SessionStatus.active,
        created_by_id=instructor.user_id,
    )
    db.add(session)
    db.flush()

    qr_token = create_qr_token(session.id, expires_delta=timedelta(minutes=10))
    session.qr_token = qr_token
    session.qr_expires_at = datetime.utcnow() + timedelta(minutes=10)

    fake_vec: List[float] = [0.1] * 512
    db.add(FaceEmbedding(student_id=student.id, photo_path=json.dumps(fake_vec), is_active=True))
    db.commit()

    return instructor, course, session, student, qr_token


FAKE_IMAGE = b"\xff\xd8\xff" + b"\x00" * 100
MOCK_PATH = "app.api.v1.endpoints.attendance.ml_client"


class TestSubmitAttendance:
    def test_successful_submission(self, client, db):
        _, _, _, _, qr_token = _full_setup(db)
        token = login(client, "student@test.com")

        with patch(f"{MOCK_PATH}.check_liveness", new_callable=AsyncMock, return_value=True), \
             patch(f"{MOCK_PATH}.extract_embedding", new_callable=AsyncMock, return_value=[0.1] * 512), \
             patch(f"{MOCK_PATH}.compare_embeddings", new_callable=AsyncMock, return_value=0.85):

            resp = client.post(
                "/api/v1/attendance/submit",
                data={"qr_token": qr_token},
                files={"image": ("face.jpg", FAKE_IMAGE, "image/jpeg")},
                headers={"Authorization": f"Bearer {token}"},
            )

        assert resp.status_code == 201
        data = resp.json()
        assert data["qr_validated"] is True
        assert data["face_validated"] is True
        assert data["face_similarity_score"] == pytest.approx(0.85)

    def test_low_similarity_rejected(self, client, db):
        _, _, _, _, qr_token = _full_setup(db)
        token = login(client, "student@test.com")

        with patch(f"{MOCK_PATH}.check_liveness", new_callable=AsyncMock, return_value=True), \
             patch(f"{MOCK_PATH}.extract_embedding", new_callable=AsyncMock, return_value=[0.1] * 512), \
             patch(f"{MOCK_PATH}.compare_embeddings", new_callable=AsyncMock, return_value=0.30):

            resp = client.post(
                "/api/v1/attendance/submit",
                data={"qr_token": qr_token},
                files={"image": ("face.jpg", FAKE_IMAGE, "image/jpeg")},
                headers={"Authorization": f"Bearer {token}"},
            )

        assert resp.status_code == 422
        assert "similarity" in resp.json()["detail"]

    def test_no_face_detected(self, client, db):
        _, _, _, _, qr_token = _full_setup(db)
        token = login(client, "student@test.com")

        with patch(f"{MOCK_PATH}.check_liveness", new_callable=AsyncMock, return_value=True), \
             patch(f"{MOCK_PATH}.extract_embedding", new_callable=AsyncMock, return_value=None):

            resp = client.post(
                "/api/v1/attendance/submit",
                data={"qr_token": qr_token},
                files={"image": ("face.jpg", FAKE_IMAGE, "image/jpeg")},
                headers={"Authorization": f"Bearer {token}"},
            )

        assert resp.status_code == 422
        assert "No face" in resp.json()["detail"]

    def test_invalid_qr_rejected(self, client, db):
        make_student(db)
        token = login(client, "student@test.com")
        resp = client.post(
            "/api/v1/attendance/submit",
            data={"qr_token": "totally.invalid.token"},
            files={"image": ("face.jpg", FAKE_IMAGE, "image/jpeg")},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 400

    def test_duplicate_submission_rejected(self, client, db):
        _, _, _, _, qr_token = _full_setup(db)
        token = login(client, "student@test.com")

        with patch(f"{MOCK_PATH}.check_liveness", new_callable=AsyncMock, return_value=True), \
             patch(f"{MOCK_PATH}.extract_embedding", new_callable=AsyncMock, return_value=[0.1] * 512), \
             patch(f"{MOCK_PATH}.compare_embeddings", new_callable=AsyncMock, return_value=0.85):

            client.post("/api/v1/attendance/submit",
                        data={"qr_token": qr_token},
                        files={"image": ("face.jpg", FAKE_IMAGE, "image/jpeg")},
                        headers={"Authorization": f"Bearer {token}"})

            resp2 = client.post("/api/v1/attendance/submit",
                                data={"qr_token": qr_token},
                                files={"image": ("face.jpg", FAKE_IMAGE, "image/jpeg")},
                                headers={"Authorization": f"Bearer {token}"})

        assert resp2.status_code == 409

    def test_unenrolled_student_rejected(self, client, db):
        _, instructor = make_instructor(db)
        course = make_course(db, instructor, code="CS401")
        session = AttendanceSession(
            course_id=course.id, title="S",
            status=SessionStatus.active, created_by_id=instructor.user_id,
        )
        db.add(session)
        db.flush()
        qr_token = create_qr_token(session.id, expires_delta=timedelta(minutes=10))
        session.qr_token = qr_token
        session.qr_expires_at = datetime.utcnow() + timedelta(minutes=10)
        make_student(db)
        db.commit()

        token = login(client, "student@test.com")
        resp = client.post(
            "/api/v1/attendance/submit",
            data={"qr_token": qr_token},
            files={"image": ("face.jpg", FAKE_IMAGE, "image/jpeg")},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 403


class TestAttendanceHistory:
    def test_student_views_own_history(self, client, db):
        make_student(db)
        token = login(client, "student@test.com")
        resp = client.get("/api/v1/attendance/my", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_student_summary(self, client, db):
        make_student(db)
        token = login(client, "student@test.com")
        resp = client.get("/api/v1/attendance/my/summary",
                          headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)
