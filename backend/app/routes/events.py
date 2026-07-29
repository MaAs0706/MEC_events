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

VENUES = [
    {
        "name": "Main Auditorium",
        "capacity": 500
    },
    {
        "name": "Seminar Hall",
        "capacity": 120
    },
    {
        "name": "Tech Lab",
        "capacity": 80
    },
    {
        "name": "Sports Complex",
        "capacity": 800
    }
]


def has_time_conflict(
    db: Session,
    venue: str,
    date: str,
    start_time: str,
    end_time: str,
    exclude_event_id: int | None = None
):
    query = (
        db.query(Event)
        .filter(Event.venue == venue)
        .filter(Event.date == date)
        .filter(Event.status.in_(["pending", "approved"]))
        .filter(Event.start_time < end_time)
        .filter(Event.end_time > start_time)
    )

    if exclude_event_id is not None:
        query = query.filter(Event.id != exclude_event_id)

    return query.first() is not None


def validate_event_time(start_time: str, end_time: str):
    if start_time >= end_time:
        raise HTTPException(
            status_code=400,
            detail="Event end time must be after start time"
        )


def get_booking_load(bookings: list[Event]):
    booked_minutes = 0

    for booking in bookings:
        if not booking.start_time or not booking.end_time:
            continue

        start_hour, start_minute = [
            int(part)
            for part in booking.start_time.split(":")
        ]
        end_hour, end_minute = [
            int(part)
            for part in booking.end_time.split(":")
        ]

        booked_minutes += (
            (end_hour * 60 + end_minute)
            - (start_hour * 60 + start_minute)
        )

    return min(booked_minutes / (12 * 60), 1)


@router.post("/events")
def create_event(
    
    event: EventCreate,
    current_user = Depends(
        require_role(["coordinator", "admin"])
    ),
    db: Session = Depends(get_db)
):
    validate_event_time(
        event.start_time,
        event.end_time
    )

    if has_time_conflict(
        db,
        event.venue,
        event.date,
        event.start_time,
        event.end_time
    ):
        raise HTTPException(
            status_code=400,
            detail="Venue is already booked for this time"
        )

    new_event = Event(
        title=event.title,
        description=event.description,
        category=event.category,
        venue=event.venue,
        date=event.date,
        start_time=event.start_time,
        end_time=event.end_time,
        status="pending",
        organizer=event.organizer,
        created_by=current_user.id,
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
    query = db.query(Event)

    if current_user.role != "admin":
        query = query.filter(Event.created_by == current_user.id)

    return query.all()

@router.get("/events/availability")
def get_venue_availability(
    date: str,
    db: Session = Depends(get_db)
):
    bookings = (
        db.query(Event)
        .filter(Event.date == date)
        .filter(Event.status.in_(["pending", "approved"]))
        .all()
    )

    availability = []

    for venue in VENUES:
        venue_bookings = [
            booking
            for booking in bookings
            if booking.venue == venue["name"]
        ]

        availability.append(
            {
                "venue": venue["name"],
                "capacity": venue["capacity"],
                "load": get_booking_load(venue_bookings),
                "bookings": [
                    {
                        "event_id": booking.id,
                        "title": booking.title,
                        "start_time": booking.start_time,
                        "end_time": booking.end_time,
                        "status": booking.status
                    }
                    for booking in venue_bookings
                ]
            }
        )

    return availability

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

    if (
        current_user.role != "admin"
        and event.created_by != current_user.id
    ):
        raise HTTPException(
            status_code=403,
            detail="You can only update your own events"
        )

    validate_event_time(
        updated_event.start_time,
        updated_event.end_time
    )

    if has_time_conflict(
        db,
        updated_event.venue,
        updated_event.date,
        updated_event.start_time,
        updated_event.end_time,
        exclude_event_id=event.id
    ):
        raise HTTPException(
            status_code=400,
            detail="Venue is already booked for this time"
        )

    event.title = updated_event.title
    event.description = updated_event.description
    event.category = updated_event.category
    event.venue = updated_event.venue
    event.date = updated_event.date
    event.start_time = updated_event.start_time
    event.end_time = updated_event.end_time
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

    if (
        current_user.role != "admin"
        and event.created_by != current_user.id
    ):
        raise HTTPException(
            status_code=403,
            detail="You can only update your own events"
        )

    update_data = updates.model_dump(
        exclude_unset=True
    )
    update_data.pop("status",None)
    update_data.pop("attendees",None)

    next_venue = update_data.get("venue", event.venue)
    next_date = update_data.get("date", event.date)
    next_start_time = update_data.get("start_time", event.start_time)
    next_end_time = update_data.get("end_time", event.end_time)

    validate_event_time(
        next_start_time,
        next_end_time
    )

    if has_time_conflict(
        db,
        next_venue,
        next_date,
        next_start_time,
        next_end_time,
        exclude_event_id=event.id
    ):
        raise HTTPException(
            status_code=400,
            detail="Venue is already booked for this time"
        )

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
