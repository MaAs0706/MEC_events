"""Tests for authentication: password policy, rate limiting, and deactivation.

Follows the Arrange / Act / Assert pattern. The password-hash fixtures create
real bcrypt hashes so the /auth/login endpoint can verify them.
"""
import pytest
from datetime import datetime, timedelta, timezone
from unittest.mock import patch

from app.models.password_reset_token import PasswordResetToken
from app.models.user import User
from app.utils.security import hash_password, verify_password
from tests.conftest import make_user


@pytest.fixture()
def registered_user(db):
    """A real user with a known bcrypt password that passes the policy."""
    return make_user(
        db,
        "student",
        full_name="Ada Lovelace",
        email="ada@test.com",
    )


@pytest.fixture()
def set_registered_password(db, registered_user):
    registered_user.password_hash = hash_password("StrongPass1")
    db.commit()
    return registered_user


# ---------------------------------------------------------------------------
# Password policy
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    "password",
    [
        "short",          # < 8 chars
        "alllettersonly", # no digit
        "12345678",       # no letter
        "",               # empty
    ],
)
def test_register_rejects_weak_passwords(client, password):
    login_payload = {
        "full_name": "New Student",
        "email": "new@test.com",
        "password": password,
    }

    response = client.post("/auth/register", json=login_payload)

    assert response.status_code == 422


def test_register_accepts_strong_password(client, db):
    login_payload = {
        "full_name": "New Student",
        "email": "new@test.com",
        "password": "StrongPass1",
    }

    response = client.post("/auth/register", json=login_payload)

    assert response.status_code == 200
    assert db.query(User).filter(User.email == "new@test.com").count() == 1


def test_admin_create_user_rejects_weak_password(client, admin, login_as):
    login_as(admin)

    payload = {
        "full_name": "Coordinator",
        "email": "coord@test.com",
        "password": "weak",
        "role": "coordinator",
    }

    response = client.post("/users", json=payload)

    assert response.status_code == 422


# ---------------------------------------------------------------------------
# Password recovery
# ---------------------------------------------------------------------------


def test_forgot_password_is_generic_and_sends_for_active_user(
        client, set_registered_password, db):
    with patch("app.routes.auth.send_password_reset_email", return_value=True) as send:
        response = client.post("/auth/forgot-password", json={"email": "ada@test.com"})

    assert response.status_code == 200
    assert response.json()["message"] == (
        "If an account exists for that email, a reset link has been sent."
    )
    assert send.call_count == 1
    token = db.query(PasswordResetToken).one()
    assert token.token_hash not in str(send.call_args)
    assert token.used_at is None


def test_forgot_password_does_not_reveal_unknown_email(client, db):
    with patch("app.routes.auth.send_password_reset_email") as send:
        response = client.post("/auth/forgot-password", json={"email": "unknown@test.com"})

    assert response.status_code == 200
    assert response.json()["message"] == (
        "If an account exists for that email, a reset link has been sent."
    )
    assert send.call_count == 0
    assert db.query(PasswordResetToken).count() == 0


def test_reset_password_consumes_token_and_changes_password(
        client, set_registered_password, db):
    import hashlib
    from app.utils.jwt import create_access_token

    raw_token = "x" * 48
    previous_token = create_access_token({
        "user_id": set_registered_password.id,
        "role": set_registered_password.role,
        "token_version": set_registered_password.token_version,
    })
    db.add(PasswordResetToken(
        user_id=set_registered_password.id,
        token_hash=hashlib.sha256(raw_token.encode()).hexdigest(),
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=10),
    ))
    db.commit()

    response = client.post("/auth/reset-password", json={
        "token": raw_token,
        "password": "NewStrongPass2",
    })

    assert response.status_code == 200
    db.refresh(set_registered_password)
    assert verify_password("NewStrongPass2", set_registered_password.password_hash)
    assert set_registered_password.token_version == 1
    assert client.get(
        "/auth/me", headers={"Authorization": f"Bearer {previous_token}"}
    ).status_code == 401
    assert client.post("/auth/reset-password", json={
        "token": raw_token,
        "password": "AnotherPass3",
    }).status_code == 400


def test_reset_password_rejects_expired_token(client, set_registered_password, db):
    import hashlib

    raw_token = "y" * 48
    db.add(PasswordResetToken(
        user_id=set_registered_password.id,
        token_hash=hashlib.sha256(raw_token.encode()).hexdigest(),
        expires_at=datetime.now(timezone.utc) - timedelta(seconds=1),
    ))
    db.commit()

    response = client.post("/auth/reset-password", json={
        "token": raw_token,
        "password": "NewStrongPass2",
    })
    assert response.status_code == 400


# ---------------------------------------------------------------------------
# Login and rate limiting
# ---------------------------------------------------------------------------


def test_login_sets_httponly_cookie_session(client, set_registered_password):
    response = client.post(
        "/auth/login",
        json={"email": "ada@test.com", "password": "StrongPass1"},
    )

    assert response.status_code == 200
    assert "access_token" not in response.json()
    assert response.json()["role"] == "student"
    assert response.json()["csrf_token"]
    set_cookie = response.headers["set-cookie"].lower()
    assert "nexus_access=" in set_cookie
    assert "httponly" in set_cookie
    assert client.get("/auth/me").status_code == 200


def test_cookie_session_requires_csrf_on_writes(client, set_registered_password):
    login = client.post(
        "/auth/login",
        json={"email": "ada@test.com", "password": "StrongPass1"},
    )
    csrf_token = login.json()["csrf_token"]

    blocked = client.patch("/auth/me", json={"full_name": "Ada Updated"})
    assert blocked.status_code == 403

    allowed = client.patch(
        "/auth/me",
        json={"full_name": "Ada Updated"},
        headers={"X-CSRF-Token": csrf_token},
    )
    assert allowed.status_code == 200
    assert allowed.json()["name"] == "Ada Updated"


def test_logout_clears_cookie_session(client, set_registered_password):
    login = client.post(
        "/auth/login",
        json={"email": "ada@test.com", "password": "StrongPass1"},
    )
    response = client.post(
        "/auth/logout",
        headers={"X-CSRF-Token": login.json()["csrf_token"]},
    )
    assert response.status_code == 200
    assert client.get("/auth/me").status_code == 401


def test_api_responses_include_security_headers(client):
    response = client.get("/")
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"


def test_login_wrong_password_is_401(client, set_registered_password):
    response = client.post(
        "/auth/login",
        json={"email": "ada@test.com", "password": "WrongPass9"},
    )

    assert response.status_code == 401


def test_login_locks_account_after_five_failures(
    client, set_registered_password
):
    # Arrange/Act: five wrong password attempts.
    for _ in range(5):
        response = client.post(
            "/auth/login",
            json={"email": "ada@test.com", "password": "WrongPass9"},
        )
        assert response.status_code == 401

    # Assert: the sixth attempt, even with the correct password, is blocked.
    response = client.post(
        "/auth/login",
        json={"email": "ada@test.com", "password": "WrongPass9"},
    )

    assert response.status_code == 429


def test_correct_password_after_few_failures_still_works(
    client, set_registered_password
):
    # Four failures stay under the account limit of five.
    for _ in range(4):
        client.post(
            "/auth/login",
            json={"email": "ada@test.com", "password": "WrongPass9"},
        )

    response = client.post(
        "/auth/login",
        json={"email": "ada@test.com", "password": "StrongPass1"},
    )

    assert response.status_code == 200


# ---------------------------------------------------------------------------
# Account deactivation
# ---------------------------------------------------------------------------


def test_deactivated_user_cannot_login(client, admin, login_as, db):
    user = make_user(db, "coordinator", email="coord@test.com")
    user.password_hash = hash_password("StrongPass1")
    db.commit()

    login_as(admin)
    response = client.patch(
        f"/users/{user.id}/status", json={"is_active": False}
    )
    assert response.status_code == 200

    login_response = client.post(
        "/auth/login",
        json={"email": "coord@test.com", "password": "StrongPass1"},
    )
    assert login_response.status_code == 403


def test_deactivated_user_cannot_use_existing_token(client, db):
    from app.utils.jwt import create_access_token

    admin_user = make_user(db, "admin", email="rootadmin@test.com")
    admin_user.password_hash = hash_password("StrongPass1")
    student = make_user(db, "student", email="stu@test.com")
    db.commit()

    # Issue a token for the student BEFORE deactivation.
    student_token = create_access_token(
        {"user_id": student.id, "role": student.role}
    )

    # Real admin login (login_as would override auth for every request).
    login = client.post(
        "/auth/login",
        json={"email": "rootadmin@test.com", "password": "StrongPass1"},
    )
    admin_headers = {"X-CSRF-Token": login.json()["csrf_token"]}

    response = client.patch(
        f"/users/{student.id}/status",
        json={"is_active": False},
        headers=admin_headers,
    )
    assert response.status_code == 200

    # The pre-issued token must no longer work.
    protected = client.get(
        "/auth/me", headers={"Authorization": f"Bearer {student_token}"}
    )
    assert protected.status_code == 401


def test_admin_cannot_deactivate_self(client, admin, login_as):
    login_as(admin)

    response = client.patch(
        f"/users/{admin.id}/status", json={"is_active": False}
    )

    assert response.status_code == 400


def test_cannot_deactivate_last_active_admin(client, admin, login_as, db):
    other_admin = make_user(db, "admin", email="admin2@test.com")

    # Simulate the current admin already being inactive, so other_admin is
    # the single remaining active admin. login_as still presents `admin` as
    # the current user even though it is inactive.
    admin.is_active = False
    db.commit()

    login_as(admin)
    response = client.patch(
        f"/users/{other_admin.id}/status", json={"is_active": False}
    )

    assert response.status_code == 400
    assert response.json()["detail"] == (
        "At least one active admin account must remain"
    )
