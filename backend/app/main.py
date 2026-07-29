from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.models.user import User
from app.models.event import Event
from app.models.registration import Registration
from app.models.venue import Venue
from app.routes.auth import router as auth_router
from app.routes.venues import router as venue_router

from app.routes.events import router as event_router

app = FastAPI()

Base.metadata.create_all(bind=engine)
app.add_middleware(
    CORSMiddleware,
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


app.include_router(event_router)
app.include_router(auth_router)
app.include_router(venue_router)


@app.get("/")
def home():
    return {
        "message": "Welcome to NEXUS!"
    }
