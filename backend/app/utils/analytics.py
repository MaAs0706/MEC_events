"""Small, failure-safe request analytics helpers.

Analytics must never stop a request from succeeding. If the metrics table is
temporarily unavailable, the request still completes normally.
"""

import hashlib

from app.database import SessionLocal
from app.models.analytics_event import AnalyticsEvent


def visitor_hash(visitor_id: str | None) -> str | None:
    if not visitor_id or len(visitor_id) > 200:
        return None
    return hashlib.sha256(visitor_id.encode("utf-8")).hexdigest()


def record_request(
    path: str,
    method: str,
    status_code: int,
    duration_ms: int,
    visitor_id: str | None,
) -> None:
    """Persist a request metric without exposing visitor identity."""
    db = None
    try:
        db = SessionLocal()
        db.add(
            AnalyticsEvent(
                path=path[:255],
                method=method[:10],
                status_code=status_code,
                duration_ms=max(duration_ms, 0),
                visitor_hash=visitor_hash(visitor_id),
                is_error=status_code >= 500,
            )
        )
        db.commit()
    except Exception:
        if db is not None:
            db.rollback()
    finally:
        if db is not None:
            db.close()
