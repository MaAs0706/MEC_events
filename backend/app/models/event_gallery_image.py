from sqlalchemy import Column, ForeignKey, Integer, String

from app.database import Base


class EventGalleryImage(Base):
    """A photo captured after an approved event has taken place."""

    __tablename__ = "event_gallery_images"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(
        Integer,
        ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    filename = Column(String, nullable=False)
    public_id = Column(String, nullable=True)
    uploaded_at = Column(String, nullable=False)
