from sqlalchemy import Column, ForeignKey, Integer, String

from app.database import Base


class EventSession(Base):
    """One reserved venue/time slot belonging to an event request."""

    __tablename__ = "event_sessions"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    venue = Column(String, nullable=False)
    date = Column(String, nullable=False, index=True)
    start_time = Column(String, nullable=False)
    end_time = Column(String, nullable=False)
