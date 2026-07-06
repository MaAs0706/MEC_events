from fastapi import FastAPI

from app.database import engine, Base

from app.routes.events import router as event_router

app = FastAPI()

Base.metadata.create_all(bind=engine)

app.include_router(event_router)


@app.get("/")
def home():
    return {
        "message": "Welcome to NEXUS!"
    }