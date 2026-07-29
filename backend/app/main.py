from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.database import engine, Base
from app.models.user import User
from app.models.event import Event
from app.models.registration import Registration
from app.models.venue import Venue
from app.routes.auth import router as auth_router
from app.routes.venues import router as venue_router

from app.routes.events import router as event_router

fastapi_app = FastAPI()

Base.metadata.create_all(bind=engine)

with engine.begin() as connection:
    connection.execute(
        text(
            "ALTER TABLE events "
            "ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id)"
        )
    )
    connection.execute(
        text(
            "ALTER TABLE events "
            "ADD COLUMN IF NOT EXISTS start_time VARCHAR"
        )
    )
    connection.execute(
        text(
            "ALTER TABLE events "
            "ADD COLUMN IF NOT EXISTS end_time VARCHAR"
        )
    )
    connection.execute(
        text(
            "ALTER TABLE events "
            "ADD COLUMN IF NOT EXISTS rejection_reason TEXT"
        )
    )
    connection.execute(
        text(
            "ALTER TABLE events "
            "ADD COLUMN IF NOT EXISTS reviewed_by INTEGER REFERENCES users(id)"
        )
    )
    connection.execute(
        text(
            "ALTER TABLE events "
            "ADD COLUMN IF NOT EXISTS reviewed_at VARCHAR"
        )
    )
    connection.execute(
        text(
            "INSERT INTO venues (name, capacity) "
            "VALUES "
            "('Main Auditorium', 500), "
            "('Seminar Hall', 120), "
            "('Tech Lab', 80), "
            "('Sports Complex', 800) "
            "ON CONFLICT (name) DO NOTHING"
        )
    )

fastapi_app.include_router(event_router)
fastapi_app.include_router(auth_router)
fastapi_app.include_router(venue_router)


@fastapi_app.get("/")
def home():
    return {
        "message": "Welcome to NEXUS!"
    }


app = CORSMiddleware(
    fastapi_app,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

"""
Wrapping FastAPI with CORSMiddleware keeps CORS headers on error responses too,
which makes frontend debugging clearer when an endpoint returns 500.
"""
