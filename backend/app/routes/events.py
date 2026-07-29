from fastapi import APIRouter
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.event import Event 
from app.models.registration import Registration
from app.models.user import User 

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
        status="pending",
        organizer=event.organizer,
        attendees=0,
        capacity=event.capacity,
        image=event.image
    )

    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    return new_event

@router.get("/events")
def get_events(db: Session = Depends(get_db)):
    return (
        db.query(Event)
        .filter(Event.status == "approved")
        .all()
    )

@router.get("/events/pending")
def get_pending_events(
    current_user: User = Depends(
        require_role(["approver", "admin"])
    ),
    db: Session = Depends(get_db)
):
    return (
        db.query(Event)
        .filter(Event.status == "pending")
        .all()
    )

@router.get("/events/manage")
def get_manage_events(
    current_user: User = Depends(
        require_role(["coordinator", "admin"])
    ),
    db: Session = Depends(get_db)
):
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
    event.status = "pending"
    event.organizer = updated_event.organizer
    event.attendees = 0
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
    update_data.pop("status",None)
    update_data.pop("attendees",None)

    for key, value in update_data.items():
        setattr(event, key, value)
    event.status="pending"    

    db.commit()

    db.refresh(event)

    return event

@router.patch("/events/{event_id}/approve")
def approve_event(
    event_id: int,
    current_user: User = Depends(
        require_role(["approver", "admin"])
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

    if event.status != "pending":
        raise HTTPException(
            status_code=400,
            detail="Only pending events can be approved"
        )

    event.status = "approved"


    db.commit()
    db.refresh(event)

    return event

@router.patch("/events/{event_id}/reject")
def reject_event(
    event_id: int,
    current_user: User = Depends(
        require_role(["approver", "admin"])
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

    if event.status != "pending":
        raise HTTPException(
            status_code=400,
            detail="Only pending events can be rejected"
        )

    event.status = "rejected"

    db.commit()
    db.refresh(event)

    return event

@router.post("/events/{event_id}/register")
def register_for_event(
    event_id: int,
    current_user: User = Depends(
        require_role(["student"])
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

    if event.status != "approved":
        raise HTTPException(
            status_code=400,
            detail="Only approved events can be registered for"
        )

    if event.attendees >= event.capacity:
        raise HTTPException(
            status_code=400,
            detail="Event capacity is full"
        )

    existing_registration = (
        db.query(Registration)
        .filter(Registration.event_id == event_id)
        .filter(Registration.student_id == current_user.id)
        .first()
    )

    if existing_registration:
        raise HTTPException(
            status_code=400,
            detail="You are already registered for this event"
        )

    registration = Registration(
        event_id=event_id,
        student_id=current_user.id
    )

    event.attendees += 1

    db.add(registration)
    db.commit()
    db.refresh(event)

    return {
        "message": "Registered successfully",
        "event": event
    }
