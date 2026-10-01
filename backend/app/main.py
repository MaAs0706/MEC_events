import os
import secrets
from time import perf_counter
from pathlib import Path

from dotenv import load_dotenv

from fastapi import FastAPI
from sqlalchemy import text
from app.database import SessionLocal
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.routes.auth import router as auth_router
from app.routes.users import router as user_router
from app.routes.venues import router as venue_router
from app.routes.analytics import router as analytics_router
from app.routes.notifications import router as notification_router
from app.routes.letter_templates import router as letter_template_router
from app.utils.analytics import record_request
from app.utils.session import ACCESS_COOKIE_NAME, CSRF_COOKIE_NAME, CSRF_HEADER_NAME

from app.routes.events import router as event_router

load_dotenv()

fastapi_app = FastAPI()

fastapi_app.include_router(event_router)
fastapi_app.include_router(auth_router)
fastapi_app.include_router(user_router)
fastapi_app.include_router(venue_router)
fastapi_app.include_router(analytics_router)
fastapi_app.include_router(notification_router)
fastapi_app.include_router(letter_template_router)

UPLOADS_DIR = Path(__file__).resolve().parent.parent / "uploads"
# Local uploads are only a development fallback; production media is stored in
# Cloudinary. The directory still has to exist because Starlette validates a
# StaticFiles mount during application startup. Docker images begin without
# empty, git-ignored directories, so create it explicitly.
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

fastapi_app.mount(
    "/uploads",
    StaticFiles(directory=str(UPLOADS_DIR)),
    name="uploads"
)


SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}
CSRF_EXEMPT_PATHS = {
    "/auth/login",
    "/auth/register",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/auth/csrf",
}


@fastapi_app.middleware("http")
async def require_csrf_for_cookie_sessions(request, call_next):
    """Reject cross-site writes made with an automatically sent session cookie.

    Explicit Bearer-token clients remain supported for the API/docs. The CSRF
    check applies only to cookie sessions, whose browser credential would
    otherwise be attached to a malicious cross-site request automatically.
    """
    if (
        request.method not in SAFE_METHODS
        and request.url.path not in CSRF_EXEMPT_PATHS
        and request.cookies.get(ACCESS_COOKIE_NAME)
    ):
        cookie_token = request.cookies.get(CSRF_COOKIE_NAME)
        header_token = request.headers.get(CSRF_HEADER_NAME)
        if not cookie_token or not header_token or not secrets.compare_digest(cookie_token, header_token):
            from fastapi.responses import JSONResponse
            return JSONResponse(status_code=403, content={"detail": "CSRF validation failed"})
    return await call_next(request)


@fastapi_app.middleware("http")
async def add_security_headers(request, call_next):
    """Defence-in-depth headers for API responses and generated downloads."""
    response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "no-referrer")
    response.headers.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
    if os.getenv("APP_ENV", "development").lower() == "production":
        response.headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
    return response


@fastapi_app.middleware("http")
async def capture_request_analytics(request, call_next):
    """Record API traffic without collecting raw IP addresses or emails."""
    path = request.url.path
    # Reading the dashboard must not inflate the traffic figures it displays.
    # Authenticated dashboard requests also fan out into several database reads.
    # Do not add a second analytics write connection to each of those requests;
    # public page traffic is what the visitor metric is designed to represent.
    if (
        path.startswith("/analytics")
        or path.startswith("/docs")
        or path.startswith("/openapi")
        or request.cookies.get(ACCESS_COOKIE_NAME)
    ):
        return await call_next(request)

    started_at = perf_counter()
    status_code = 500
    try:
        response = await call_next(request)
        status_code = response.status_code
        return response
    finally:
        record_request(
            path=path,
            method=request.method,
            status_code=status_code,
            duration_ms=round((perf_counter() - started_at) * 1000),
            visitor_id=request.headers.get("X-Nexus-Visitor"),
        )


@fastapi_app.get("/")
def home():
    return {
        "message": "Welcome to NEXUS!"
    }


@fastapi_app.get("/health")
def health_check():
    """Health probe for the deployment platform and reverse proxy."""
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "reachable"}
    finally:
        db.close()


# ---------------------------------------------------------------------------
# CORS: allowed origins come from the CORS_ORIGINS env var (comma separated).
# If unset, fall back to the local Vite dev servers for development.
# ---------------------------------------------------------------------------
DEFAULT_DEV_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
]

cors_origins_env = os.getenv("CORS_ORIGINS")
cors_origins = (
    [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]
    if cors_origins_env
    else DEFAULT_DEV_ORIGINS
)

app = CORSMiddleware(
    fastapi_app,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

"""
Wrapping FastAPI with CORSMiddleware keeps CORS headers on error responses too,
which makes frontend debugging clearer when an endpoint returns 500.
"""
