from pydantic import BaseModel


class EventCreate(BaseModel):

    title: str

    description: str

    category: str

    venue: str

    date: str

    status: str

    organizer: str

    attendees: int

    capacity: int

    image: str