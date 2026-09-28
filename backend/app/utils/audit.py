"""Small append-only audit-log helper.

Audit entries intentionally record stable identifiers and human-readable
summaries, never passwords, JWTs, reset tokens, or uploaded file contents.
"""

from app.models.audit_log import AuditLog


def record_audit(db, *, actor_user_id: int | None, action: str, target_type: str,
                 target_id: int | str | None, summary: str) -> None:
    db.add(
        AuditLog(
            actor_user_id=actor_user_id,
            action=action[:100],
            target_type=target_type[:50],
            target_id=str(target_id)[:100] if target_id is not None else None,
            summary=summary[:2000],
        )
    )
