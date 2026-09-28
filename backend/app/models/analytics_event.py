from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Integer, String

from app.database import Base


class AnalyticsEvent(Base):
    """A privacy-conscious record of one API request.

    `visitor_hash` is a one-way hash of a browser-generated random ID. It lets
    us count returning visitors without storing a person's IP address, email,
    or raw browser identifier.
    """

    __tablename__ = "analytics_events"

    id = Column(Integer, primary_key=True, index=True)
    occurred_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )
    path = Column(String(255), nullable=False, index=True)
    method = Column(String(10), nullable=False)
    status_code = Column(Integer, nullable=False, index=True)
    duration_ms = Column(Integer, nullable=False)
    visitor_hash = Column(String(64), nullable=True, index=True)
    is_error = Column(Boolean, nullable=False, default=False, index=True)
