from __future__ import annotations

from app.models.models import AttendanceSession, SessionStatus
from tests.conftest import login, make_course, make_instructor, make_student


class TestSessionCreate:
    def test_creates_session_with_qr(self, client, db):
        _, instructor = make_instructor(db)
        course = make_course(db, instructor, code="CS300")
        token = login(client, "instructor@test.com")
        resp = client.post("/api/v1/sessions",
                           json={"course_id": course.id, "title": "Week 1"},
                           headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 201
        data = resp.json()
        assert data["status"] == "active"
        assert data["qr_token"] is not None
        assert len(data["qr_image_base64"]) > 100

    def test_only_one_active_session_per_course(self, client, db):
        _, instructor = make_instructor(db)
        course = make_course(db, instructor, code="CS301")
        token = login(client, "instructor@test.com")

        r1 = client.post("/api/v1/sessions", json={"course_id": course.id},
                         headers={"Authorization": f"Bearer {token}"})
        session1_id = r1.json()["id"]

        client.post("/api/v1/sessions", json={"course_id": course.id},
                    headers={"Authorization": f"Bearer {token}"})

        old = db.query(AttendanceSession).filter(AttendanceSession.id == session1_id).first()
        assert old.status == SessionStatus.closed

    def test_student_cannot_create_session(self, client, db):
        make_student(db)
        token = login(client, "student@test.com")
        resp = client.post("/api/v1/sessions", json={"course_id": 1},
                           headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 403

    def test_wrong_instructor_course_rejected(self, client, db):
        _, inst1 = make_instructor(db, email="inst1@test.com")
        _, inst2 = make_instructor(db, email="inst2@test.com")
        course = make_course(db, inst1, code="CS302")
        token = login(client, "inst2@test.com")
        resp = client.post("/api/v1/sessions", json={"course_id": course.id},
                           headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 404


class TestSessionClose:
    def test_close_session(self, client, db):
        _, instructor = make_instructor(db)
        course = make_course(db, instructor, code="CS310")
        token = login(client, "instructor@test.com")
        r = client.post("/api/v1/sessions", json={"course_id": course.id},
                        headers={"Authorization": f"Bearer {token}"})
        sid = r.json()["id"]
        resp = client.post(f"/api/v1/sessions/{sid}/close",
                           headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
        assert resp.json()["status"] == "closed"


class TestQRRenewal:
    def test_renew_gives_new_token(self, client, db):
        _, instructor = make_instructor(db)
        course = make_course(db, instructor, code="CS320")
        token = login(client, "instructor@test.com")
        r = client.post("/api/v1/sessions", json={"course_id": course.id},
                        headers={"Authorization": f"Bearer {token}"})
        sid = r.json()["id"]
        old_qr = r.json()["qr_token"]

        resp = client.post(f"/api/v1/sessions/{sid}/renew-qr",
                           headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
        assert resp.json()["qr_token"] != old_qr
        assert resp.json()["qr_image_base64"] is not None
