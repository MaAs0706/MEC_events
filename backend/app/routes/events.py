from fastapi import APIRouter
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from app.models import Event 

from dependencies import get_db
from schemas import EventCreate, EventUpdate

router = APIRouter()

@router.post("/events")
def create_event(
    event: EventCreate,
    db: Session = Depends(get_db)
):
    new_event = Event(
        title=event.title,
        description=event.description,
        category=event.category,
        venue=event.venue,
        date=event.date,
        status=event.status,
        organizer=event.organizer,
        attendees=event.attendees,
        capacity=event.capacity,
        image=event.image
    )

    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    return new_event

@router.get("/events")
def get_events(db: Session = Depends(get_db)):

    return db.query(Event).all()