from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.dependencies import require_role
from app.models.event import Event
from app.models.venue import Venue
from app.schemas.venue import VenueCreate
from app.schemas.venue import VenueUpdate
from app.utils.audit import record_audit


router = APIRouter(prefix="/venues")


@router.get("")
def get_venues(
    db: Session = Depends(get_db)
):
    return db.query(Venue).all()


@router.post("")
def create_venue(
    venue: VenueCreate,
    current_user = Depends(
        require_role(["admin"])
    ),
    db: Session = Depends(get_db)
):
    existing_venue = (
        db.query(Venue)
        .filter(Venue.name == venue.name)
        .first()
    )

    if existing_venue:
        raise HTTPException(
            status_code=400,
            detail="Venue already exists"
        )

    new_venue = Venue(
        name=venue.name,
        capacity=venue.capacity
    )

    db.add(new_venue)
    db.flush()
    record_audit(
        db, actor_user_id=current_user.id, action="venue.created",
        target_type="venue", target_id=new_venue.id,
        summary=f"Admin created venue {new_venue.name} with capacity {new_venue.capacity}.",
    )
    db.commit()
    db.refresh(new_venue)

    return new_venue


@router.put("/{venue_id}")
def update_venue(
    venue_id: int,
    venue: VenueUpdate,
    current_user = Depends(
        require_role(["admin"])
    ),
    db: Session = Depends(get_db)
):
    existing_venue = (
        db.query(Venue)
        .filter(Venue.id == venue_id)
        .first()
    )

    if not existing_venue:
        raise HTTPException(
            status_code=404,
            detail="Venue not found"
        )

    events_using_venue = (
        db.query(Event)
        .filter(Event.venue == existing_venue.name)
        .all()
    )

    if venue.name != existing_venue.name and events_using_venue:
        raise HTTPException(
            status_code=400,
            detail="A venue used by events cannot be renamed"
        )

    duplicate_venue = (
        db.query(Venue)
        .filter(Venue.name == venue.name)
        .filter(Venue.id != venue_id)
        .first()
    )

    if duplicate_venue:
        raise HTTPException(
            status_code=400,
            detail="Venue already exists"
        )

    if any(event.capacity > venue.capacity for event in events_using_venue):
        raise HTTPException(
            status_code=400,
            detail="Venue capacity cannot be lower than an event using it"
        )

    previous_name = existing_venue.name
    existing_venue.name = venue.name
    existing_venue.capacity = venue.capacity
    record_audit(
        db, actor_user_id=current_user.id, action="venue.updated",
        target_type="venue", target_id=existing_venue.id,
        summary=f"Admin updated venue {previous_name} to capacity {existing_venue.capacity}.",
    )

    db.commit()
    db.refresh(existing_venue)

    return existing_venue


@router.delete("/{venue_id}")
def delete_venue(
    venue_id: int,
    current_user = Depends(
        require_role(["admin"])
    ),
    db: Session = Depends(get_db)
):
    existing_venue = (
        db.query(Venue)
        .filter(Venue.id == venue_id)
        .first()
    )

    if not existing_venue:
        raise HTTPException(
            status_code=404,
            detail="Venue not found"
        )

    event_uses_venue = (
        db.query(Event)
        .filter(Event.venue == existing_venue.name)
        .first()
    )

    if event_uses_venue:
        raise HTTPException(
            status_code=400,
            detail="This venue is used by events and cannot be removed"
        )

    record_audit(
        db, actor_user_id=current_user.id, action="venue.deleted",
        target_type="venue", target_id=existing_venue.id,
        summary=f"Admin deleted venue {existing_venue.name}.",
    )
    db.delete(existing_venue)
    db.commit()

    return {
        "message": "Venue deleted successfully"
    }
