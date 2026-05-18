from __future__ import annotations

from app.core.security import get_password_hash
from app.models.models import User, UserRole
from tests.conftest import login, make_instructor, make_student


def make_admin(db, email: str = "admin@test.com", password: str = "password123") -> User:
    user = User(
        email=email,
        hashed_password=get_password_hash(password),
        first_name="Admin",
        last_name="User",
        role=UserRole.admin,
        is_active=True,
    )
    db.add(user)
    db.commit()
    return user


class TestAdminStats:
    def test_admin_gets_stats(self, client, db):
        make_admin(db)
        token = login(client, "admin@test.com")
        resp = client.get("/api/v1/admin/stats", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
        assert "total_users" in resp.json()

    def test_student_blocked(self, client, db):
        make_student(db)
        token = login(client, "student@test.com")
        resp = client.get("/api/v1/admin/stats", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 403

    def test_instructor_blocked(self, client, db):
        make_instructor(db)
        token = login(client, "instructor@test.com")
        resp = client.get("/api/v1/admin/stats", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 403


class TestUserManagement:
    def test_list_users(self, client, db):
        make_admin(db)
        make_student(db)
        token = login(client, "admin@test.com")
        resp = client.get("/api/v1/admin/users", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
        assert len(resp.json()) >= 2

    def test_deactivate_and_activate(self, client, db):
        make_admin(db)
        student_user, _ = make_student(db)
        token = login(client, "admin@test.com")

        resp = client.patch(f"/api/v1/admin/users/{student_user.id}/deactivate",
                            headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
        assert resp.json()["is_active"] is False

        resp = client.patch(f"/api/v1/admin/users/{student_user.id}/activate",
                            headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
        assert resp.json()["is_active"] is True
