from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.dependencies import get_db, require_role
from app.models.analytics_event import AnalyticsEvent
from app.models.audit_log import AuditLog
from app.models.event import Event
from app.models.event_session import EventSession
from app.models.registration import Registration
from app.models.user import User
from app.models.venue import Venue


router = APIRouter(prefix="/analytics")


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def as_utc(value: datetime) -> datetime:
    """SQLite test databases may return naive datetimes; treat them as UTC."""
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value


@router.get("/audit-logs")
def get_audit_logs(
    limit: int = 100,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    """Return recent security-relevant actions without exposing credentials."""
    safe_limit = min(max(limit, 1), 200)
    rows = db.query(AuditLog).order_by(AuditLog.id.desc()).limit(safe_limit).all()
    actor_ids = {row.actor_user_id for row in rows if row.actor_user_id is not None}
    actors = {
        user.id: user.full_name
        for user in db.query(User).filter(User.id.in_(actor_ids)).all()
    } if actor_ids else {}
    return {
        "items": [
            {
                "id": row.id,
                "action": row.action,
                "target_type": row.target_type,
                "target_id": row.target_id,
                "summary": row.summary,
                "actor_user_id": row.actor_user_id,
                "actor_name": actors.get(row.actor_user_id),
                "created_at": row.created_at.isoformat(),
            }
            for row in rows
        ]
    }


@router.get("/admin-summary")
def get_admin_summary(
    days: int = Query(default=14, ge=7, le=30),
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db),
):
    """Return real operational metrics for the admin dashboard only."""
    now = utc_now()
    today = now.date()
    active_cutoff = now - timedelta(minutes=5)
    # The dashboard offers deliberate 7/14/30-day views. Keeping this bounded
    # prevents an admin report from turning into an unbounded analytics query.
    period_days = min(max(days, 7), 30)
    history_start = today - timedelta(days=period_days - 1)

    request_rows = (
        db.query(AnalyticsEvent)
        .filter(AnalyticsEvent.occurred_at >= datetime.combine(history_start, datetime.min.time(), tzinfo=timezone.utc))
        .all()
    )
    today_rows = [row for row in request_rows if as_utc(row.occurred_at).date() == today]
    active_rows = [row for row in request_rows if as_utc(row.occurred_at) >= active_cutoff]

    daily = []
    for offset in range(period_days):
        day = history_start + timedelta(days=offset)
        rows = [row for row in request_rows if as_utc(row.occurred_at).date() == day]
        daily.append(
            {
                "date": day.isoformat(),
                "requests": len(rows),
                "visitors": len({row.visitor_hash for row in rows if row.visitor_hash}),
            }
        )

    all_events = db.query(Event).all()
    terminal_events = [event for event in all_events if event.status in ["approved", "rejected"]]
    approved_events = [event for event in all_events if event.status == "approved"]
    rejected_events = [event for event in all_events if event.status == "rejected"]
    pending_events = [event for event in all_events if event.status == "pending"]
    errors = [row for row in request_rows if row.is_error]

    error_counts: dict[tuple[str, int], int] = {}
    for error in errors:
        key = (error.path, error.status_code)
        error_counts[key] = error_counts.get(key, 0) + 1

    top_errors = [
        {"path": path, "status_code": status_code, "count": count}
        for (path, status_code), count in sorted(
            error_counts.items(), key=lambda item: item[1], reverse=True
        )[:5]
    ]

    return {
        "generated_at": now.isoformat(),
        "period_days": period_days,
        "traffic": {
            "today_requests": len(today_rows),
            "today_visitors": len({row.visitor_hash for row in today_rows if row.visitor_hash}),
            "active_visitors": len({row.visitor_hash for row in active_rows if row.visitor_hash}),
            "daily": daily,
        },
        "operations": {
            "total_users": db.query(User).count(),
            "total_venues": db.query(Venue).count(),
            "total_events": len(all_events),
            "events_today": (
                db.query(EventSession.event_id)
                .filter(EventSession.date == today.isoformat())
                .distinct()
                .count()
            ),
            "pending_reviews": len(pending_events),
            "approved_events": len(approved_events),
            "rejected_events": len(rejected_events),
            "approval_rate": round(len(approved_events) / len(terminal_events) * 100) if terminal_events else 0,
            "total_registrations": db.query(Registration).count(),
        },
        "reliability": {
            "errors_last_14_days": len(errors),
            "top_errors": top_errors,
        },
    }
