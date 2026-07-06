from fastapi import FastAPI

from app.database import engine, Base
from app.models.event import Event

Base.metadata.create_all(bind=engine)

app = FastAPI()


@app.get("/")
def home():
    return {
        "message": "Welcome to NEXUS!"
    }