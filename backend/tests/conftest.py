import os

# Set env vars BEFORE importing any app modules, because app.database and
# app.dependencies read them at import time and raise if they are missing.
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["SECRET_KEY"] = "test-secret-key"
os.environ["ALGORITHM"] = "HS256"

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

# Import all models so their tables are registered on Base.metadata.
from app.database import Base
from app.models.user import User
from app.models.event import Event
from app.models.event_gallery_image import EventGalleryImage  # noqa: F401
from app.models.analytics_event import AnalyticsEvent  # noqa: F401
from app.models.notification import Notification  # noqa: F401
from app.models.password_reset_token import PasswordResetToken  # noqa: F401
from app.models.venue import Venue
from app.models.registration import Registration  # noqa: F401

from app.dependencies import get_db, get_current_user
from app.main import fastapi_app


# ---------------------------------------------------------------------------
# Test database (fresh in-memory SQLite per test)
# ---------------------------------------------------------------------------

@pytest.fixture()
def db():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )

    TestingSessionLocal = sessionmaker(
        bind=engine,
        autocommit=False,
        autoflush=False
    )

    # Create all tables in the in-memory database.
    Base.metadata.create_all(bind=engine)

    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        # Drop everything so the next test starts clean.
        Base.metadata.drop_all(bind=engine)


# ---------------------------------------------------------------------------
# Test client (uses the test database, not Supabase)
# ---------------------------------------------------------------------------

@pytest.fixture()
def client(db):
    # Swap FastAPI's real get_db dependency with one that uses our test session.
    def override_get_db():
        try:
            yield db
        finally:
            pass

    fastapi_app.dependency_overrides[get_db] = override_get_db

    with TestClient(fastapi_app) as test_client:
        yield test_client

    # Clean up overrides between tests so they don't leak.
    fastapi_app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Auth: fake signed-in users
# ---------------------------------------------------------------------------

def make_user(db, role, full_name="Test User", email=None):
    user = User(
        full_name=full_name,
        email=email or f"{role}_{id(db)}@test.com",
        password_hash="not-used-in-tests",
        role=role
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture()
def coordinator(db):
    return make_user(db, "coordinator")


@pytest.fixture()
def student(db):
    return make_user(db, "student")


@pytest.fixture()
def approver(db):
    return make_user(db, "approver")


@pytest.fixture()
def admin(db):
    return make_user(db, "admin")


@pytest.fixture()
def sample_venue(db):
    venue = Venue(name="Main Auditorium", capacity=500)
    db.add(venue)
    db.commit()
    db.refresh(venue)
    return venue


@pytest.fixture()
def login_as(client):
    """Return a function that makes the app treat `user` as signed in.

    Behind the scenes this tells FastAPI: whenever any endpoint calls
    get_current_user, return our fake user object instead of decoding a JWT.
    """
    def _login_as(user):
        def override_get_current_user():
            return user

        fastapi_app.dependency_overrides[get_current_user] = (
            override_get_current_user
        )

    return _login_as


@pytest.fixture(autouse=True)
def reset_rate_limit_state():
    """Clear in-memory login rate limits before every test.

    The rate limiter is module-level state shared across tests, so without
    this a single burst of failed logins could poison later tests.
    """
    yield
    from app.utils.rate_limit import reset_all
    reset_all()
