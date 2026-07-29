from pydantic import BaseModel


class VenueCreate(BaseModel):

    name: str
    capacity: int


class VenueUpdate(BaseModel):

    name: str
    capacity: int
