from fastapi import FastAPI
from app.database import engine, base
from models.event import Event



app = FastAPI()
Event.metadata.create_all(bind=engine)

@app.get("/")
def home():
    return {"message": "Welcome to the NEXUS!"}