from pydantic import BaseModel

from typing import List, Optional


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

class EventReject(BaseModel):

    rejection_reason: str
