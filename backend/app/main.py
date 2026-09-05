from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.routes.auth import router as auth_router
from app.routes.users import router as user_router
from app.routes.venues import router as venue_router

from app.routes.events import router as event_router

fastapi_app = FastAPI()

fastapi_app.include_router(event_router)
fastapi_app.include_router(auth_router)
fastapi_app.include_router(user_router)
fastapi_app.include_router(venue_router)

fastapi_app.mount(
    "/uploads",
    StaticFiles(directory="uploads"),
    name="uploads"
)


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
