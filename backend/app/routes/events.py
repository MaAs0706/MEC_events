from fastapi import APIRouter
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.event import Event 

from app.dependencies import get_db
from app.schemas.event import EventCreate
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

@router.get("/events/{event_id}")    
def get_event(
    event_id:int ,
    db:session = Depends(get_db)

):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event