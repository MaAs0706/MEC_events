from sqlalchemy import Column
from sqlalchemy import ForeignKey
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy import Text

from app.database import Base


class Event(Base):

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

    start_time = Column(String)

    end_time = Column(String)

    status = Column(String)

    rejection_reason = Column(Text)

    reviewed_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True
    )

    reviewed_at = Column(String)

    organizer = Column(String)

    created_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True
    )

    attendees = Column(Integer)

    capacity = Column(Integer)

    image = Column(String)
