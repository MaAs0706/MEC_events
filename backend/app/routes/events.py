from fastapi import APIRouter
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.event import Event 

from app.schemas.event import EventUpdate

from app.dependencies import get_db, require_role
from app.schemas.event import EventCreate
router = APIRouter()

@router.post("/events")
def create_event(
    
    event: EventCreate,
    current_user = Depends(
        require_role(["coordinator", "admin"])
    ),
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
    db:Session = Depends(get_db)

):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event

@router.put("/events/{event_id}")
def update_event(
     event_id: int,
    updated_event: EventCreate,
    current_user = Depends(
        require_role(["coordinator", "admin"])
    ),
    db: Session = Depends(get_db)
):

    event = (
        db.query(Event)
        .filter(Event.id == event_id)
        .first()
    )

    if not event:
        raise HTTPException(
            status_code=404,
            detail="Event not found"
        )

    event.title = updated_event.title
    event.description = updated_event.description
    event.category = updated_event.category
    event.venue = updated_event.venue
    event.date = updated_event.date
    event.status = updated_event.status
    event.organizer = updated_event.organizer
    event.attendees = updated_event.attendees
    event.capacity = updated_event.capacity
    event.image = updated_event.image

    db.commit()
    db.refresh(event)

    return event


@router.patch("/events/{event_id}")
def update_event(
   event_id: int,
    updates: EventUpdate,
    current_user = Depends(
        require_role(["coordinator", "admin"])
    ),
    db: Session = Depends(get_db)
):

    event = (
        db.query(Event)
        .filter(Event.id == event_id)
        .first()
    )

    if not event:
        raise HTTPException(
            status_code=404,
            detail="Event not found"
        )

    update_data = updates.model_dump(
        exclude_unset=True
    )

    for key, value in update_data.items():
        setattr(event, key, value)

    db.commit()

    db.refresh(event)

    return event