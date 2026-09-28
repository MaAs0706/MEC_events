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

    # Cloudinary public ID is required to replace or delete the cover safely.
    image_public_id = Column(String, nullable=True)

    # Immutable branding/text values captured at approval time. This keeps an
    # older letter unchanged when the global template is edited later.
    permission_letter_snapshot = Column(Text, nullable=True)

    # Copied from the submitting coordinator so future profile edits do not
    # alter an event's club identity.
    club_logo_url = Column(String(1000), nullable=True)
