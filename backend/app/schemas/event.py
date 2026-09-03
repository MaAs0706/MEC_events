from pydantic import BaseModel, field_validator

from typing import List, Optional


def validate_image_url(value) -> str:
    if value is None:
        return value
    if value == "no":
        return value
    if not value.startswith(("http://", "https://")):
        raise ValueError("Image must be a valid http(s) URL")
    return value


class EventCreate(BaseModel):

    title: str
    description: str
    category: str
    venue: str
    date: str
    start_time: str
    end_time: str
    organizer: str
    capacity: int
    image: str

    _validate_image = field_validator("image")(validate_image_url)

class EventUpdate(BaseModel):

    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    venue: Optional[str] = None
    date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    status: Optional[str] = None
    organizer: Optional[str] = None
    attendees: Optional[int] = None
    capacity: Optional[int] = None
    image: Optional[str] = None

    _validate_image = field_validator("image")(validate_image_url)

class EventReject(BaseModel):

    rejection_reason: str
