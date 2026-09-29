from pydantic import BaseModel, Field, field_validator, model_validator

from typing import Optional
from datetime import datetime


# ---------------------------------------------------------------------------
# Field validators
# ---------------------------------------------------------------------------


def _validate_date(value: Optional[str]) -> Optional[str]:
    """Ensure the date is an actual calendar date in YYYY-MM-DD format."""
    if value is None:
        return value
    try:
        parsed = datetime.strptime(value, "%Y-%m-%d")
    except ValueError:
        raise ValueError("Date must be in YYYY-MM-DD format")
    # strptime is lenient about zero padding (accepts 2027-1-15), so do a
    # round-trip check to reject anything that is not exactly YYYY-MM-DD.
    if parsed.strftime("%Y-%m-%d") != value:
        raise ValueError("Date must be in YYYY-MM-DD format")
    return value


def _validate_time(value: Optional[str]) -> Optional[str]:
    """Ensure the time is zero-padded 24-hour HH:MM format.

    Strict format matters: events.py compares start_time and end_time
    with plain string comparison, which only works reliably for HH:MM.
    """
    if value is None:
        return value
    try:
        parsed = datetime.strptime(value, "%H:%M")
    except ValueError:
        raise ValueError("Time must be in HH:MM (24-hour) format")
    # Round-trip check to reject non-zero-padded values like "9:00".
    if parsed.strftime("%H:%M") != value:
        raise ValueError("Time must be in HH:MM (24-hour) format")
    return value


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------


class EventSessionCreate(BaseModel):
    """A date, time and venue reserved as part of one event request."""

    venue: str = Field(min_length=1, max_length=100)
    date: str
    start_time: str
    end_time: str

    validate_date = field_validator("date")(_validate_date)
    validate_start_time = field_validator("start_time")(_validate_time)
    validate_end_time = field_validator("end_time")(_validate_time)


class EventCreate(BaseModel):

    title: str = Field(min_length=1, max_length=150)
    description: str = Field(min_length=1, max_length=5000)
    category: str = Field(min_length=1, max_length=50)
    # Legacy one-slot fields remain accepted so existing integrations continue
    # to work. New clients send one or more values in `sessions`.
    venue: Optional[str] = Field(default=None, min_length=1, max_length=100)
    date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    sessions: list[EventSessionCreate] = Field(default_factory=list, max_length=20)
    organizer: str = Field(min_length=1, max_length=100)
    capacity: int = Field(ge=1, le=10000)
    image: Optional[str] = None

    validate_date = field_validator("date")(_validate_date)
    validate_start_time = field_validator("start_time")(_validate_time)
    validate_end_time = field_validator("end_time")(_validate_time)

    @model_validator(mode="after")
    def require_a_schedule(self):
        if self.sessions:
            return self
        if not all([self.venue, self.date, self.start_time, self.end_time]):
            raise ValueError("Add at least one date, time, and venue for this event")
        return self


class EventUpdate(BaseModel):

    title: Optional[str] = Field(default=None, min_length=1, max_length=150)
    description: Optional[str] = Field(default=None, min_length=1, max_length=5000)
    category: Optional[str] = Field(default=None, min_length=1, max_length=50)
    venue: Optional[str] = Field(default=None, min_length=1, max_length=100)
    date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    sessions: Optional[list[EventSessionCreate]] = Field(default=None, max_length=20)
    status: Optional[str] = None
    organizer: Optional[str] = Field(default=None, min_length=1, max_length=100)
    attendees: Optional[int] = Field(default=None, ge=0)
    capacity: Optional[int] = Field(default=None, ge=1, le=10000)
    image: Optional[str] = None

    validate_date = field_validator("date")(_validate_date)
    validate_start_time = field_validator("start_time")(_validate_time)
    validate_end_time = field_validator("end_time")(_validate_time)


class EventReject(BaseModel):

    rejection_reason: str = Field(min_length=1, max_length=500)
