from fastapi import APIRouter
from fastapi import Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from datetime import datetime
from datetime import timezone
from sqlalchemy.orm import Session
from app.models.event import Event 
from app.models.event_gallery_image import EventGalleryImage
from app.models.registration import Registration
from app.models.user import User 
from app.models.venue import Venue

from app.schemas.event import EventUpdate
from app.schemas.event import EventReject

from app.dependencies import get_db, get_optional_current_user, require_role
from app.schemas.event import EventCreate
from app.utils.media_storage import delete_image, MediaStorageError, upload_image
from app.utils.permission_letter import build_permission_letter

import os
from io import BytesIO

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
UPLOAD_DIR = os.path.join(BACKEND_DIR, "uploads", "events")
GALLERY_UPLOAD_DIR = os.path.join(BACKEND_DIR, "uploads", "gallery")
PUBLIC_API_URL = os.getenv("PUBLIC_API_URL", "http://127.0.0.1:8000").rstrip("/")

MAX_SIZE = 5 * 1024 * 1024
MAX_GALLERY_IMAGES = 20
router = APIRouter()

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


def validate_event_capacity(
    db: Session,
    venue_name: str,
    capacity: int,
    attendees: int = 0
):
    if capacity < 1:
        raise HTTPException(
            status_code=400,
            detail="Event capacity must be at least 1"
        )

    venue = (
        db.query(Venue)
        .filter(Venue.name == venue_name)
        .first()
    )

    if not venue:
        raise HTTPException(
            status_code=400,
            detail="Selected venue does not exist"
        )

    if capacity > venue.capacity:
        raise HTTPException(
            status_code=400,
            detail="Event capacity exceeds venue capacity"
        )

    if capacity < attendees:
        raise HTTPException(
            status_code=400,
            detail="Event capacity cannot be lower than current registrations"
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


def get_venues(db: Session):
    venues = db.query(Venue).all()
    return [
        {
            "name": venue.name,
            "capacity": venue.capacity
        }
        for venue in venues
    ]


def event_image_url(image):
    if not image:
        return None
    if image.startswith("http"):
        return image
    return f"{PUBLIC_API_URL}/uploads/events/{image}"


def gallery_image_url(filename: str):
    if filename.startswith("http"):
        return filename
    return f"{PUBLIC_API_URL}/uploads/gallery/{filename}"


def is_past_approved_event(event: Event) -> bool:
    return event.status == "approved" and event.date < datetime.now().date().isoformat()


def can_manage_event(event: Event, current_user: User) -> bool:
    return current_user.role == "admin" or event.created_by == current_user.id


def validate_image(file: UploadFile) -> bytes:
    """Validate image bytes rather than trusting only the browser MIME type."""
    contents = file.file.read(MAX_SIZE + 1)

    if len(contents) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="File size must be under 5MB")

    signatures = {
        "image/jpeg": (b"\xff\xd8\xff", "jpg"),
        "image/png": (b"\x89PNG\r\n\x1a\n", "png"),
        "image/gif": (b"GIF87a", "gif"),
        "image/webp": (b"RIFF", "webp"),
    }
    expected = signatures.get(file.content_type or "")
    if not expected or not contents.startswith(expected[0]):
        raise HTTPException(
            status_code=400,
            detail="File must be a valid JPEG, PNG, WebP, or GIF image",
        )
    if file.content_type == "image/webp" and contents[8:12] != b"WEBP":
        raise HTTPException(status_code=400, detail="File must be a valid WebP image")

    return contents


def serialize_event(event: Event, db: Session):
    reviewer = None
    if event.reviewed_by is not None:
        reviewer = (
            db.query(User)
            .filter(User.id == event.reviewed_by)
            .first()
        )

    image_url = event_image_url(event.image)

    return {
        "id": event.id,
        "title": event.title,
        "description": event.description,
        "category": event.category,
        "venue": event.venue,
        "date": event.date,
        "start_time": event.start_time,
        "end_time": event.end_time,
        "status": event.status,
        "rejection_reason": event.rejection_reason,
        "reviewed_by": event.reviewed_by,
        "reviewed_at": event.reviewed_at,
        "organizer": event.organizer,
        "created_by": event.created_by,
        "attendees": event.attendees,
        "capacity": event.capacity,
        "image": image_url,
        "approved_by_name": reviewer.full_name if reviewer else None,
        "approved_by_role": reviewer.role if reviewer else None,
    }


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

    validate_event_capacity(
        db,
        event.venue,
        event.capacity
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
    events = (
        db.query(Event)
        .filter(Event.status == "approved")
        .all()
    )
    return [
        serialize_event(event, db)
        for event in events
    ]


@router.get("/events/past")
def get_past_events(db: Session = Depends(get_db)):
    """Public archive of approved events that have already taken place."""
    today = datetime.now().date().isoformat()
    events = (
        db.query(Event)
        .filter(Event.status == "approved")
        .filter(Event.date < today)
        .order_by(Event.date.desc())
        .all()
    )
    return [serialize_event(event, db) for event in events]

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

    events = query.all()

    return [
        serialize_event(event, db)
        for event in events
    ]

@router.get("/events/availability")
def get_venue_availability(
    date: str,
    current_user: User = Depends(
        require_role(["coordinator", "admin"])
    ),
    db: Session = Depends(get_db)
):
    bookings = (
        db.query(Event)
        .filter(Event.date == date)
        .filter(Event.status.in_(["pending", "approved"]))
        .all()
    )

    availability = []

    for venue in get_venues(db):
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
    event_id: int,
    current_user: User | None = Depends(
        get_optional_current_user
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

    # Approved events are intentionally visible from the public landing page.
    if event.status == "approved":
        return serialize_event(event, db)

    # Pending and rejected requests are internal. A coordinator can only read
    # their own request, while approvers and admins can review all requests.
    can_view_internal_event = (
        current_user is not None
        and (
            current_user.role in ["approver", "admin"]
            or (
                current_user.role == "coordinator"
                and event.created_by == current_user.id
            )
        )
    )

    if not can_view_internal_event:
        # Returning 404 avoids confirming that a hidden event ID exists.
        raise HTTPException(
            status_code=404,
            detail="Event not found"
        )

    return serialize_event(event, db)


@router.get("/events/{event_id}/gallery")
def get_event_gallery(
    event_id: int,
    current_user: User | None = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    can_view = is_past_approved_event(event)
    if current_user and (
        current_user.role in ["admin", "approver"]
        or (current_user.role == "coordinator" and event.created_by == current_user.id)
    ):
        can_view = True
    if not can_view:
        raise HTTPException(status_code=404, detail="Event gallery not found")

    images = (
        db.query(EventGalleryImage)
        .filter(EventGalleryImage.event_id == event.id)
        .order_by(EventGalleryImage.id.desc())
        .all()
    )
    return [
        {"id": image.id, "image": gallery_image_url(image.filename), "uploaded_at": image.uploaded_at}
        for image in images
    ]


@router.get("/events/{event_id}/permission-letter")
def download_permission_letter(
    event_id: int,
    current_user: User = Depends(require_role(["coordinator", "admin"])),
    db: Session = Depends(get_db),
):
    """Download a PDF permission letter for an approved event."""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if not can_manage_event(event, current_user):
        raise HTTPException(status_code=403, detail="You can only download letters for your own events")
    if event.status != "approved":
        raise HTTPException(status_code=400, detail="A permission letter is available only after approval")

    reviewer = db.query(User).filter(User.id == event.reviewed_by).first()
    pdf = build_permission_letter(
        event,
        reviewer.full_name if reviewer else "NEXUS Administration",
        reviewer.role if reviewer else "Approver",
    )
    safe_title = "".join(char if char.isalnum() else "-" for char in event.title).strip("-")
    return StreamingResponse(
        BytesIO(pdf),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{safe_title or "event"}-permission-letter.pdf"'
        },
    )

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

    validate_event_capacity(
        db,
        updated_event.venue,
        updated_event.capacity,
        event.attendees
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
        exclude_unset=True,
        exclude_none=True
    )
    update_data.pop("status",None)
    update_data.pop("attendees",None)

    next_venue = update_data.get("venue", event.venue)
    next_date = update_data.get("date", event.date)
    next_start_time = update_data.get("start_time", event.start_time)
    next_end_time = update_data.get("end_time", event.end_time)
    next_capacity = update_data.get("capacity", event.capacity)

    validate_event_time(
        next_start_time,
        next_end_time
    )

    validate_event_capacity(
        db,
        next_venue,
        next_capacity,
        event.attendees
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
    event.rejection_reason = None
    event.reviewed_by = current_user.id
    event.reviewed_at = datetime.now(timezone.utc).isoformat()


    db.commit()
    db.refresh(event)

    return event

@router.patch("/events/{event_id}/reject")
def reject_event(
    event_id: int,
    rejection: EventReject,
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
    event.rejection_reason = rejection.rejection_reason
    event.reviewed_by = current_user.id
    event.reviewed_at = datetime.now(timezone.utc).isoformat()

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
        .with_for_update()
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

    if event.attendees >= event.capacity:
        raise HTTPException(
            status_code=400,
            detail="Event capacity is full"
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

@router.get("/events/{event_id}/registration-status")
def get_registration_status(
    event_id: int,
    current_user: User = Depends(
        require_role(["student"])
    ),
    db: Session = Depends(get_db)
):
    registration = (
        db.query(Registration)
        .filter(Registration.event_id == event_id)
        .filter(Registration.student_id == current_user.id)
        .first()
    )

    return {
        "registered": registration is not None
    }

@router.get("/events/{event_id}/attendees")
def get_event_attendees(
    event_id: int,
    current_user: User = Depends(
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
            detail="You can only view attendees for your own events"
        )

    attendees = (
        db.query(User)
        .join(
            Registration,
            Registration.student_id == User.id
        )
        .filter(Registration.event_id == event_id)
        .all()
    )

    return [
        {
            "id": attendee.id,
            "full_name": attendee.full_name,
            "email": attendee.email,
            "class_name": attendee.class_name,
            "phone": attendee.phone
        }
        for attendee in attendees
    ]


@router.post("/events/{event_id}/image")
def upload_event_image(
    event_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(
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

    if not can_manage_event(event, current_user):
        raise HTTPException(
            status_code=403,
            detail="You can only upload images for your own events"
        )

    contents = validate_image(file)
    try:
        uploaded = upload_image(contents, "nexus/events/covers")
    except MediaStorageError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    old_file = event.image
    old_public_id = event.image_public_id
    event.image = uploaded["url"]
    event.image_public_id = uploaded["public_id"]
    try:
        db.commit()
        db.refresh(event)
    except Exception:
        db.rollback()
        try:
            delete_image(uploaded["public_id"])
        except MediaStorageError:
            pass
        raise

    if old_public_id:
        try:
            delete_image(old_public_id)
        except MediaStorageError:
            # The new upload is valid; do not turn a cleanup failure into a 500.
            pass
    elif old_file and not old_file.startswith("http"):
        old_path = os.path.join(UPLOAD_DIR, old_file)
        if os.path.exists(old_path):
            os.remove(old_path)

    return serialize_event(event, db)


@router.post("/events/{event_id}/gallery")
def upload_gallery_image(
    event_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(require_role(["coordinator", "admin"])),
    db: Session = Depends(get_db),
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if not can_manage_event(event, current_user):
        raise HTTPException(status_code=403, detail="You can only upload photos for your own events")
    if not is_past_approved_event(event):
        raise HTTPException(
            status_code=400,
            detail="Gallery photos can only be added after an approved event has ended",
        )
    image_count = db.query(EventGalleryImage).filter(EventGalleryImage.event_id == event.id).count()
    if image_count >= MAX_GALLERY_IMAGES:
        raise HTTPException(status_code=400, detail="An event gallery can contain at most 20 images")

    contents = validate_image(file)
    try:
        uploaded = upload_image(contents, "nexus/events/gallery")
    except MediaStorageError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    gallery_image = EventGalleryImage(
        event_id=event.id,
        filename=uploaded["url"],
        public_id=uploaded["public_id"],
        uploaded_at=datetime.now(timezone.utc).isoformat(),
    )
    db.add(gallery_image)
    db.commit()
    db.refresh(gallery_image)
    return {"id": gallery_image.id, "image": gallery_image_url(gallery_image.filename), "uploaded_at": gallery_image.uploaded_at}


@router.delete("/events/{event_id}/gallery/{image_id}")
def delete_gallery_image(
    event_id: int,
    image_id: int,
    current_user: User = Depends(require_role(["coordinator", "admin"])),
    db: Session = Depends(get_db),
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if not can_manage_event(event, current_user):
        raise HTTPException(status_code=403, detail="You can only remove photos from your own events")
    image = (
        db.query(EventGalleryImage)
        .filter(EventGalleryImage.id == image_id, EventGalleryImage.event_id == event.id)
        .first()
    )
    if not image:
        raise HTTPException(status_code=404, detail="Gallery image not found")
    if image.public_id:
        try:
            delete_image(image.public_id)
        except MediaStorageError as exc:
            raise HTTPException(status_code=503, detail=str(exc)) from exc

    db.delete(image)
    db.commit()
    image_path = os.path.join(GALLERY_UPLOAD_DIR, image.filename)
    if not image.public_id and not image.filename.startswith("http") and os.path.exists(image_path):
        os.remove(image_path)
    return {"message": "Gallery image deleted"}


@router.delete("/events/{event_id}/image")
def delete_event_image(
    event_id: int,
    current_user: User = Depends(
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
            detail="You can only delete images for your own events"
        )

    if event.image_public_id:
        try:
            delete_image(event.image_public_id)
        except MediaStorageError as exc:
            raise HTTPException(status_code=503, detail=str(exc)) from exc
    elif event.image and not event.image.startswith("http"):
        old_path = os.path.join(UPLOAD_DIR, event.image)
        if os.path.exists(old_path):
            os.remove(old_path)

    event.image = None
    event.image_public_id = None
    db.commit()
    db.refresh(event)

    return serialize_event(event, db)
