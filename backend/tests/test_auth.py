from __future__ import annotations

from tests.conftest import login, make_instructor, make_student


class TestRegisterStudent:
    def test_register_success(self, client):
        resp = client.post("/api/v1/auth/register/student", json={
            "email": "new@test.com", "password": "password123",
            "first_name": "Alice", "last_name": "Smith",
            "student_number": "20210099", "role": "student",
        })
        assert resp.status_code == 201
        assert resp.json()["email"] == "new@test.com"

    def test_duplicate_email_rejected(self, client, db):
        make_student(db, email="dup@test.com", student_number="20210001")
        resp = client.post("/api/v1/auth/register/student", json={
            "email": "dup@test.com", "password": "password123",
            "first_name": "A", "last_name": "B",
            "student_number": "20210002", "role": "student",
        })
        assert resp.status_code == 400

    def test_duplicate_student_number_rejected(self, client, db):
        make_student(db, email="s1@test.com", student_number="20210001")
        resp = client.post("/api/v1/auth/register/student", json={
            "email": "s2@test.com", "password": "password123",
            "first_name": "A", "last_name": "B",
            "student_number": "20210001", "role": "student",
        })
        assert resp.status_code == 400

    def test_short_password_rejected(self, client):
        resp = client.post("/api/v1/auth/register/student", json={
            "email": "x@test.com", "password": "short",
            "first_name": "A", "last_name": "B",
            "student_number": "99999", "role": "student",
        })
        assert resp.status_code == 422


class TestLogin:
    def test_login_success(self, client, db):
        make_student(db, email="login@test.com")
        resp = client.post("/api/v1/auth/login",
                           data={"username": "login@test.com", "password": "password123"})
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["role"] == "student"

    def test_wrong_password(self, client, db):
        make_student(db, email="wp@test.com")
        resp = client.post("/api/v1/auth/login",
                           data={"username": "wp@test.com", "password": "wrong"})
        assert resp.status_code == 401

    def test_unknown_email(self, client):
        resp = client.post("/api/v1/auth/login",
                           data={"username": "nobody@test.com", "password": "password123"})
        assert resp.status_code == 401

    def test_inactive_user_blocked(self, client, db):
        user, _ = make_student(db, email="inactive@test.com")
        user.is_active = False
        db.commit()
        resp = client.post("/api/v1/auth/login",
                           data={"username": "inactive@test.com", "password": "password123"})
        assert resp.status_code == 400


class TestMe:
    def test_authenticated_returns_user(self, client, db):
        make_student(db, email="me@test.com")
        token = login(client, "me@test.com")
        resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
        assert resp.json()["email"] == "me@test.com"

    def test_unauthenticated_returns_401(self, client):
        resp = client.get("/api/v1/auth/me")
        assert resp.status_code == 401
