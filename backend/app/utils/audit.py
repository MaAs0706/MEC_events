"""Small append-only audit-log helper.

Audit entries intentionally record stable identifiers and human-readable
summaries, never passwords, JWTs, reset tokens, or uploaded file contents.
"""

import logging

from sqlalchemy.exc import SQLAlchemyError

from app.models.audit_log import AuditLog


logger = logging.getLogger(__name__)


def record_audit(db, *, actor_user_id: int | None, action: str, target_type: str,
                 target_id: int | str | None, summary: str) -> None:
    """Store an audit entry without turning an audit-store outage into a 500.

    The audit table is an observability control, not an authorization control.
    A savepoint means an unavailable/missing audit table does not roll back an
    otherwise valid user action. The failure is logged prominently so that an
    operator can apply the missing migration or repair the database.
    """
    try:
        with db.begin_nested():
            db.add(
                AuditLog(
                    actor_user_id=actor_user_id,
                    action=action[:100],
                    target_type=target_type[:50],
                    target_id=str(target_id)[:100] if target_id is not None else None,
                    summary=summary[:2000],
                )
            )
            db.flush()
    except SQLAlchemyError:
        logger.exception(
            "Audit log write failed for action=%s target_type=%s target_id=%s",
            action,
            target_type,
            target_id,
        )
