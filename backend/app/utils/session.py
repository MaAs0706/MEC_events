"""Cookie and CSRF helpers for browser sessions.

The access JWT is deliberately stored only in an HttpOnly cookie for browser
sessions. JavaScript receives a separate, non-sensitive CSRF value and must
echo it in a header before it can perform a state-changing request.
"""

import os
import secrets


ACCESS_COOKIE_NAME = os.getenv("ACCESS_COOKIE_NAME", "nexus_access")
CSRF_COOKIE_NAME = os.getenv("CSRF_COOKIE_NAME", "nexus_csrf")
CSRF_HEADER_NAME = "X-CSRF-Token"


def _as_bool(value: str | None, default: bool) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def cookie_secure() -> bool:
    """Require HTTPS cookies outside explicitly configured development."""
    environment = os.getenv("APP_ENV", "development").strip().lower()
    return _as_bool(os.getenv("SESSION_COOKIE_SECURE"), environment != "development")


def cookie_samesite() -> str:
    value = os.getenv("SESSION_COOKIE_SAMESITE", "lax").strip().lower()
    if value not in {"lax", "strict", "none"}:
        raise RuntimeError("SESSION_COOKIE_SAMESITE must be lax, strict, or none")
    if value == "none" and not cookie_secure():
        raise RuntimeError("SESSION_COOKIE_SAMESITE=none requires SESSION_COOKIE_SECURE=true")
    return value


def cookie_domain() -> str | None:
    value = os.getenv("SESSION_COOKIE_DOMAIN", "").strip()
    return value or None


def issue_csrf_token() -> str:
    return secrets.token_urlsafe(32)


def set_csrf_cookie(response, token: str) -> None:
    response.set_cookie(
        key=CSRF_COOKIE_NAME,
        value=token,
        httponly=False,
        secure=cookie_secure(),
        samesite=cookie_samesite(),
        domain=cookie_domain(),
        path="/",
        max_age=60 * 60 * 12,
    )


def set_session_cookies(response, access_token: str, csrf_token: str) -> None:
    response.set_cookie(
        key=ACCESS_COOKIE_NAME,
        value=access_token,
        httponly=True,
        secure=cookie_secure(),
        samesite=cookie_samesite(),
        domain=cookie_domain(),
        path="/",
        max_age=int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")) * 60,
    )
    set_csrf_cookie(response, csrf_token)


def clear_session_cookies(response) -> None:
    options = {"domain": cookie_domain(), "path": "/", "samesite": cookie_samesite()}
    response.delete_cookie(ACCESS_COOKIE_NAME, **options)
    response.delete_cookie(CSRF_COOKIE_NAME, **options)
