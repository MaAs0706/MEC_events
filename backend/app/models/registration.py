from sqlalchemy import Column
from sqlalchemy import ForeignKey
from sqlalchemy import Integer
from sqlalchemy import UniqueConstraint

from app.database import Base


class Registration(Base):

    __tablename__ = "registrations"
    __table_args__ = (
        UniqueConstraint(
            "event_id",
            "student_id",
            name="unique_event_student_registration"
        ),
    )

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    event_id = Column(
        Integer,
        ForeignKey("events.id"),
        nullable=False
    )

    student_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )
