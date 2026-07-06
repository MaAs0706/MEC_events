from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy import Text

from app.database import base


class Event(base):

    __tablename__ = "events"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    title = Column(String)

    description = Column(Text)

    category = Column(String)

    venue = Column(String)

    date = Column(String)

    status = Column(String)

    organizer = Column(String)

    attendees = Column(Integer)

    capacity = Column(Integer)

    image = Column(String)