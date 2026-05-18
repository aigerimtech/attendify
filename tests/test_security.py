from __future__ import annotations

from datetime import timedelta

from app.core.security import (
    create_access_token, create_qr_token,
    decode_token, get_password_hash,
    verify_password, verify_qr_token,
)


class TestPasswordHashing:
    def test_hash_and_verify(self):
        hashed = get_password_hash("mysecretpassword")
        assert verify_password("mysecretpassword", hashed) is True

    def test_wrong_password_fails(self):
        hashed = get_password_hash("correct")
        assert verify_password("wrong", hashed) is False

    def test_hashes_differ_same_password(self):
        assert get_password_hash("same") != get_password_hash("same")


class TestJWT:
    def test_create_and_decode(self):
        token = create_access_token({"sub": "42", "role": "student"})
        payload = decode_token(token)
        assert payload is not None
        assert payload["sub"] == "42"

    def test_expired_returns_none(self):
        token = create_access_token({"sub": "1"}, expires_delta=timedelta(seconds=-1))
        assert decode_token(token) is None

    def test_invalid_returns_none(self):
        assert decode_token("not.a.valid.token") is None


class TestQRToken:
    def test_valid_qr_token(self):
        token = create_qr_token(session_id=5)
        payload = verify_qr_token(token)
        assert payload is not None
        assert payload["session_id"] == 5
        assert payload["type"] == "qr"

    def test_expired_qr_invalid(self):
        token = create_qr_token(session_id=5, expires_delta=timedelta(seconds=-1))
        assert verify_qr_token(token) is None

    def test_access_token_rejected_as_qr(self):
        token = create_access_token({"sub": "1"})
        assert verify_qr_token(token) is None

    def test_different_sessions_differ(self):
        assert create_qr_token(1) != create_qr_token(2)
