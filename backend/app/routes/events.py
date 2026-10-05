from fastapi import APIRouter, BackgroundTasks
from fastapi import Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from datetime import datetime
from datetime import timezone
from sqlalchemy.orm import Session
from app.models.event import Event 
from app.models.event_session import EventSession
from app.models.event_gallery_image import EventGalleryImage
from app.models.registration import Registration
from app.models.user import User
from app.models.letter_template import LetterTemplate
from app.models.venue import Venue

from app.schemas.event import EventUpdate
from app.schemas.event import EventReject

from app.dependencies import get_db, get_optional_current_user, require_role
from app.schemas.event import EventCreate, EventSessionCreate
from app.utils.media_storage import delete_image, MediaStorageError, upload_image
from app.utils.permission_letter import build_permission_letter
from app.utils.notifications import create_notification
from app.utils.email import send_event_review_email
from app.utils.audit import record_audit
from app.utils.rate_limit import allow_upload, record_upload

import json
import os
from io import BytesIO
from PIL import Image, UnidentifiedImageError

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
UPLOAD_DIR = os.path.join(BACKEND_DIR, "uploads", "events")
GALLERY_UPLOAD_DIR = os.path.join(BACKEND_DIR, "uploads", "gallery")
PUBLIC_API_URL = os.getenv("PUBLIC_API_URL", "http://127.0.0.1:8000").rstrip("/")

MAX_SIZE = 5 * 1024 * 1024
MAX_IMAGE_PIXELS = 20_000_000
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
        db.query(EventSession)
        .join(Event, Event.id == EventSession.event_id)
        .filter(EventSession.venue == venue)
        .filter(EventSession.date == date)
        .filter(Event.status.in_(["pending", "approved"]))
        .filter(EventSession.start_time < end_time)
        .filter(EventSession.end_time > start_time)
    )
    if exclude_event_id is not None:
        query = query.filter(Event.id != exclude_event_id)
    if query.first() is not None:
        return True

    # Supports the brief period before the migration backfills existing rows,
    # and keeps in-memory legacy test fixtures conflict-safe.
    legacy_query = (
        db.query(Event)
        .outerjoin(EventSession, EventSession.event_id == Event.id)
        .filter(EventSession.id.is_(None))
        .filter(Event.venue == venue, Event.date == date)
        .filter(Event.status.in_(["pending", "approved"]))
        .filter(Event.start_time < end_time, Event.end_time > start_time)
    )
    if exclude_event_id is not None:
        legacy_query = legacy_query.filter(Event.id != exclude_event_id)
    return legacy_query.first() is not None


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


def event_sessions(event: Event, db: Session) -> list[EventSession]:
    sessions = (
        db.query(EventSession)
        .filter(EventSession.event_id == event.id)
        .order_by(EventSession.date, EventSession.start_time, EventSession.id)
        .all()
    )
    return sessions


def requested_sessions(event: EventCreate) -> list[EventSessionCreate]:
    if event.sessions:
        return event.sessions
    return [EventSessionCreate(
        venue=event.venue, date=event.date,
        start_time=event.start_time, end_time=event.end_time,
    )]


def validate_sessions(
    db: Session,
    sessions: list[EventSessionCreate],
    capacity: int,
    attendees: int = 0,
    exclude_event_id: int | None = None,
) -> None:
    """Validate every requested reservation before creating any of them."""
    for index, session in enumerate(sessions, start=1):
        validate_event_time(session.start_time, session.end_time)
        validate_event_capacity(db, session.venue, capacity, attendees)
        if has_time_conflict(
            db, session.venue, session.date, session.start_time, session.end_time,
            exclude_event_id=exclude_event_id,
        ):
            raise HTTPException(400, f"Schedule item {index}: {session.venue} is already booked for this time")
        for other in sessions[:index - 1]:
            if (
                other.venue == session.venue
                and other.date == session.date
                and other.start_time < session.end_time
                and other.end_time > session.start_time
            ):
                raise HTTPException(400, f"Schedule item {index} overlaps another selected slot at {session.venue}")


def replace_event_sessions(db: Session, event: Event, sessions: list[EventSessionCreate]) -> None:
    db.query(EventSession).filter(EventSession.event_id == event.id).delete()
    for session in sessions:
        db.add(EventSession(
            event_id=event.id, venue=session.venue, date=session.date,
            start_time=session.start_time, end_time=session.end_time,
        ))
    # Legacy fields are kept as the first schedule item for existing consumers.
    first = sessions[0]
    event.venue, event.date = first.venue, first.date
    event.start_time, event.end_time = first.start_time, first.end_time


def get_venues(db: Session):
    venues = db.query(Venue).all()
    return [
        {
            "name": venue.name,
            "capacity": venue.capacity
        }
        for venue in venues
    ]


def month_bounds(month: str) -> tuple[str, str]:
    """Return ISO date bounds for a YYYY-MM calendar request."""
    try:
        visible_month = datetime.strptime(month, "%Y-%m")
    except ValueError:
        raise HTTPException(status_code=400, detail="month must use YYYY-MM format")

    start = visible_month.strftime("%Y-%m-01")
    if visible_month.month == 12:
        end = f"{visible_month.year + 1}-01-01"
    else:
        end = f"{visible_month.year}-{visible_month.month + 1:02d}-01"
    return start, end


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


def is_past_approved_event(event: Event, db: Session | None = None) -> bool:
    if event.status != "approved":
        return False
    last_date = event.date
    if db is not None:
        last_date = max((session.date for session in event_sessions(event, db)), default=event.date)
    return last_date < datetime.now().date().isoformat()


def can_manage_event(event: Event, current_user: User) -> bool:
    return current_user.role == "admin" or event.created_by == current_user.id


def letter_template_snapshot(db: Session, event: Event, approver: User) -> dict:
    """Freeze the official template values used for this approval."""
    template = db.query(LetterTemplate).first()
    return {
        "college_name": template.college_name if template else "Govt. Model Engineering College, Kochi",
        "college_logo_url": template.college_logo_url if template else None,
        "club_logo_url": event.club_logo_url or (template.club_logo_url if template else None),
        "signature_url": template.signature_url if template else None,
        "signatory_name": (template.signatory_name if template and template.signatory_name else approver.full_name),
        "signatory_title": (template.signatory_title if template and template.signatory_title else approver.role.title()),
        "reference_prefix": template.reference_prefix if template else "NEXUS",
        "body_text": template.body_text if template else None,
        "approved_at": event.reviewed_at,
    }


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

    # Header signatures alone are not enough: reject malformed files and
    # decompression-bomb-sized images before they reach Cloudinary.
    try:
        with Image.open(BytesIO(contents)) as image:
            image.verify()
        with Image.open(BytesIO(contents)) as image:
            width, height = image.size
            if width < 1 or height < 1 or width * height > MAX_IMAGE_PIXELS:
                raise HTTPException(
                    status_code=400,
                    detail="Image dimensions must be below 20 megapixels",
                )
    except HTTPException:
        raise
    except (UnidentifiedImageError, OSError, SyntaxError, ValueError, Image.DecompressionBombError):
        raise HTTPException(status_code=400, detail="File must be a readable image")

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
    sessions = event_sessions(event, db)
    serialized_sessions = [
        {
            "id": session.id,
            "venue": session.venue,
            "date": session.date,
            "start_time": session.start_time,
            "end_time": session.end_time,
        }
        for session in sessions
    ]

    return {
        "id": event.id,
        "title": event.title,
        "description": event.description,
        "category": event.category,
        "venue": event.venue,
        "date": event.date,
        "start_time": event.start_time,
        "end_time": event.end_time,
        "sessions": serialized_sessions or [{
            "venue": event.venue, "date": event.date,
            "start_time": event.start_time, "end_time": event.end_time,
        }],
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
    background_tasks: BackgroundTasks,
    current_user = Depends(
        require_role(["coordinator", "admin"])
    ),
    db: Session = Depends(get_db)
):
    sessions = requested_sessions(event)
    validate_sessions(db, sessions, event.capacity)
    first_session = sessions[0]

    new_event = Event(
        title=event.title,
        description=event.description,
        category=event.category,
        venue=first_session.venue,
        date=first_session.date,
        start_time=first_session.start_time,
        end_time=first_session.end_time,
        status="pending",
        organizer=(current_user.club_name if current_user.role == "coordinator" and current_user.club_name else event.organizer),
        created_by=current_user.id,
        attendees=0,
        capacity=event.capacity,
        image=event.image,
        club_logo_url=current_user.club_logo_url if current_user.role == "coordinator" else None,
    )

    db.add(new_event)
    db.flush()
    replace_event_sessions(db, new_event, sessions)
    db.commit()
    db.refresh(new_event)
    record_audit(
        db, actor_user_id=current_user.id, action="event.created",
        target_type="event", target_id=new_event.id,
        summary=f"{current_user.role.title()} created event request {new_event.title}.",
    )
    reviewers = (
        db.query(User)
        .filter(User.role.in_(["approver", "admin"]), User.is_active.is_(True))
        .all()
    )
    for reviewer in reviewers:
        create_notification(db, reviewer.id, "New event request", f"{new_event.title} needs review.", f"/events/{new_event.id}")
    db.commit()
    schedule_summary = "; ".join(
        f"{session.date} · {session.start_time}–{session.end_time} · {session.venue}"
        for session in sessions
    )
    for reviewer in reviewers:
        background_tasks.add_task(
            send_event_review_email,
            recipient=reviewer.email,
            reviewer_name=reviewer.full_name,
            event_title=new_event.title,
            organizer=new_event.organizer,
            schedule_summary=schedule_summary,
            event_id=new_event.id,
        )
    db.refresh(new_event)
    return serialize_event(new_event, db)

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


@router.get("/events/public-calendar")
def get_public_event_calendar(month: str, db: Session = Depends(get_db)):
    """Approved event sessions for a public, month-sized calendar."""
    start, end = month_bounds(month)
    rows = (
        db.query(EventSession, Event)
        .join(Event, Event.id == EventSession.event_id)
        .filter(Event.status == "approved")
        .filter(EventSession.date >= start, EventSession.date < end)
        .order_by(EventSession.date, EventSession.start_time, Event.title)
        .all()
    )
    # Older installations may still have legacy events while a migration is
    # being applied. Keep their public calendar visible rather than treating
    # the hall as free.
    legacy_events = (
        db.query(Event)
        .outerjoin(EventSession, EventSession.event_id == Event.id)
        .filter(EventSession.id.is_(None))
        .filter(Event.status == "approved")
        .filter(Event.date >= start, Event.date < end)
        .all()
    )
    # Pending requests deliberately never appear here. These details are
    # already available through the public approved-event details page.
    calendar_items = [
        {
            "event_id": event.id,
            "title": event.title,
            "category": event.category,
            "date": session.date,
            "venue": session.venue,
            "start_time": session.start_time,
            "end_time": session.end_time,
        }
        for session, event in rows
    ]
    calendar_items.extend(
        {
            "event_id": event.id,
            "title": event.title,
            "category": event.category,
            "date": event.date,
            "venue": event.venue,
            "start_time": event.start_time,
            "end_time": event.end_time,
        }
        for event in legacy_events
    )
    return sorted(calendar_items, key=lambda item: (item["date"], item["start_time"], item["title"]))


@router.get("/events/public-venue-calendar")
def get_public_venue_calendar(venue: str, month: str, db: Session = Depends(get_db)):
    """Approved occupation data for one venue during a selected month."""
    start, end = month_bounds(month)
    selected_venue = db.query(Venue).filter(Venue.name == venue).first()
    if not selected_venue:
        raise HTTPException(status_code=404, detail="Venue not found")

    rows = (
        db.query(EventSession, Event)
        .join(Event, Event.id == EventSession.event_id)
        .filter(Event.status == "approved")
        .filter(EventSession.venue == venue)
        .filter(EventSession.date >= start, EventSession.date < end)
        .order_by(EventSession.date, EventSession.start_time, Event.title)
        .all()
    )
    legacy_events = (
        db.query(Event)
        .outerjoin(EventSession, EventSession.event_id == Event.id)
        .filter(EventSession.id.is_(None))
        .filter(Event.status == "approved", Event.venue == venue)
        .filter(Event.date >= start, Event.date < end)
        .all()
    )
    by_date: dict[str, list[tuple[EventSession, Event]]] = {}
    for session, event in rows:
        by_date.setdefault(session.date, []).append((session, event))
    for event in legacy_events:
        by_date.setdefault(event.date, []).append((event, event))

    return {
        "venue": selected_venue.name,
        "capacity": selected_venue.capacity,
        "month": month,
        "days": [
            {
                "date": date,
                "load": get_booking_load([session for session, _ in bookings]),
                "bookings": [
                    {
                        "event_id": event.id,
                        "title": event.title,
                        "date": session.date,
                        "start_time": session.start_time,
                        "end_time": session.end_time,
                    }
                    for session, event in bookings
                ],
            }
            for date, bookings in by_date.items()
        ],
    }


@router.get("/events/past")
def get_past_events(db: Session = Depends(get_db)):
    """Public archive of approved events that have already taken place."""
    today = datetime.now().date().isoformat()
    events = db.query(Event).filter(Event.status == "approved").order_by(Event.date.desc()).all()
    return [
        serialize_event(event, db) for event in events
        if max((session.date for session in event_sessions(event, db)), default=event.date) < today
    ]

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
        db.query(EventSession, Event)
        .join(Event, Event.id == EventSession.event_id)
        .filter(EventSession.date == date)
        .filter(Event.status.in_(["pending", "approved"]))
        .all()
    )

    availability = []

    for venue in get_venues(db):
        venue_bookings = [
            (session, event)
            for session, event in bookings
            if session.venue == venue["name"]
        ]

        availability.append(
            {
                "venue": venue["name"],
                "capacity": venue["capacity"],
                "load": get_booking_load([session for session, _ in venue_bookings]),
                "bookings": [
                    {
                        "event_id": event.id,
                        "title": event.title,
                        "start_time": session.start_time,
                        "end_time": session.end_time,
                        "status": event.status
                    }
                    for session, event in venue_bookings
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

    can_view = is_past_approved_event(event, db)
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
    # Older approved events predate snapshots, so render them with today's
    # configured template. New approvals always use their frozen snapshot.
    snapshot = (
        json.loads(event.permission_letter_snapshot)
        if event.permission_letter_snapshot
        else letter_template_snapshot(db, event, reviewer or current_user)
    )
    pdf = build_permission_letter(
        event,
        reviewer.full_name if reviewer else "NEXUS Administration",
        reviewer.role if reviewer else "Approver",
        template=snapshot,
        sessions=event_sessions(event, db),
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

    sessions = requested_sessions(updated_event)
    validate_sessions(db, sessions, updated_event.capacity, event.attendees, event.id)

    event.title = updated_event.title
    event.description = updated_event.description
    event.category = updated_event.category
    replace_event_sessions(db, event, sessions)
    event.status = "pending"
    event.organizer = updated_event.organizer
    event.capacity = updated_event.capacity
    event.image = updated_event.image
    record_audit(
        db, actor_user_id=current_user.id, action="event.updated",
        target_type="event", target_id=event.id,
        summary=f"{current_user.role.title()} replaced event {event.title}; it returned to pending review.",
    )

    db.commit()
    db.refresh(event)

    return serialize_event(event, db)


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
    supplied_sessions = update_data.pop("sessions", None)

    if supplied_sessions is not None:
        next_sessions = [EventSessionCreate(**session) for session in supplied_sessions]
    else:
        existing_sessions = event_sessions(event, db)
        if existing_sessions:
            # Legacy PATCH clients edit the primary (first) slot. Preserve all
            # additional slots rather than silently collapsing a multi-day
            # event back into one reservation.
            next_sessions = [
                EventSessionCreate(
                    venue=(update_data.get("venue", session.venue) if index == 0 else session.venue),
                    date=(update_data.get("date", session.date) if index == 0 else session.date),
                    start_time=(update_data.get("start_time", session.start_time) if index == 0 else session.start_time),
                    end_time=(update_data.get("end_time", session.end_time) if index == 0 else session.end_time),
                )
                for index, session in enumerate(existing_sessions)
            ]
        else:
            next_sessions = [EventSessionCreate(
                venue=update_data.get("venue", event.venue),
                date=update_data.get("date", event.date),
                start_time=update_data.get("start_time", event.start_time),
                end_time=update_data.get("end_time", event.end_time),
            )]

    next_capacity = update_data.get("capacity", event.capacity)
    validate_sessions(db, next_sessions, next_capacity, event.attendees, event.id)

    for key, value in update_data.items():
        setattr(event, key, value)
    replace_event_sessions(db, event, next_sessions)
    event.status="pending"    
    record_audit(
        db, actor_user_id=current_user.id, action="event.updated",
        target_type="event", target_id=event.id,
        summary=f"{current_user.role.title()} updated event {event.title}; it returned to pending review.",
    )

    db.commit()

    db.refresh(event)

    return serialize_event(event, db)

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
    event.permission_letter_snapshot = json.dumps(letter_template_snapshot(db, event, current_user))
    create_notification(db, event.created_by, "Event approved", f"{event.title} has been approved.", f"/events/{event.id}")
    record_audit(
        db, actor_user_id=current_user.id, action="event.approved",
        target_type="event", target_id=event.id,
        summary=f"{current_user.role.title()} approved event {event.title}.",
    )


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
    create_notification(db, event.created_by, "Event rejected", f"{event.title} was rejected. Review the feedback and resubmit when ready.", f"/events/{event.id}")
    record_audit(
        db, actor_user_id=current_user.id, action="event.rejected",
        target_type="event", target_id=event.id,
        summary=f"{current_user.role.title()} rejected event {event.title}.",
    )

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
    record_audit(
        db, actor_user_id=current_user.id, action="event.registered",
        target_type="event", target_id=event.id,
        summary=f"Student registered for event {event.title}.",
    )
    create_notification(db, current_user.id, "Registration confirmed", f"You are registered for {event.title}.", f"/events/{event.id}")
    if event.created_by != current_user.id:
        create_notification(db, event.created_by, "New event registration", f"A student registered for {event.title}.", f"/events/{event.id}")
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

    if not allow_upload(current_user.id):
        raise HTTPException(status_code=429, detail="Too many uploads. Try again later.")
    record_upload(current_user.id)

    contents = validate_image(file)
    try:
        uploaded = upload_image(contents, "nexus/events/covers")
    except MediaStorageError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    old_file = event.image
    old_public_id = event.image_public_id
    event.image = uploaded["url"]
    event.image_public_id = uploaded["public_id"]
    record_audit(
        db, actor_user_id=current_user.id, action="event.cover_uploaded",
        target_type="event", target_id=event.id,
        summary=f"{current_user.role.title()} uploaded a cover image for {event.title}.",
    )
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
    if not is_past_approved_event(event, db):
        raise HTTPException(
            status_code=400,
            detail="Gallery photos can only be added after an approved event has ended",
        )
    image_count = db.query(EventGalleryImage).filter(EventGalleryImage.event_id == event.id).count()
    if image_count >= MAX_GALLERY_IMAGES:
        raise HTTPException(status_code=400, detail="An event gallery can contain at most 20 images")

    if not allow_upload(current_user.id):
        raise HTTPException(status_code=429, detail="Too many uploads. Try again later.")
    record_upload(current_user.id)

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
    record_audit(
        db, actor_user_id=current_user.id, action="event.gallery_uploaded",
        target_type="event", target_id=event.id,
        summary=f"{current_user.role.title()} added a gallery image to {event.title}.",
    )
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

    record_audit(
        db, actor_user_id=current_user.id, action="event.gallery_deleted",
        target_type="event", target_id=event.id,
        summary=f"{current_user.role.title()} removed a gallery image from {event.title}.",
    )
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
