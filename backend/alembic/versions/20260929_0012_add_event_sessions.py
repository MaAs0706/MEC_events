"""Add multi-date and multi-venue event sessions.

Revision ID: 20260929_0012
Revises: 20260929_0011
"""

from alembic import op
import sqlalchemy as sa


revision = "20260929_0012"
down_revision = "20260929_0011"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "event_sessions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("event_id", sa.Integer(), sa.ForeignKey("events.id", ondelete="CASCADE"), nullable=False),
        sa.Column("venue", sa.String(), nullable=False),
        sa.Column("date", sa.String(), nullable=False),
        sa.Column("start_time", sa.String(), nullable=False),
        sa.Column("end_time", sa.String(), nullable=False),
    )
    op.create_index("ix_event_sessions_event_id", "event_sessions", ["event_id"])
    op.create_index("ix_event_sessions_date", "event_sessions", ["date"])
    op.create_index("ix_event_sessions_venue_date", "event_sessions", ["venue", "date"])

    # Every existing one-slot event becomes a one-session event. The legacy
    # columns stay in place as the event's primary/first session for API and
    # PDF compatibility.
    op.execute(
        """
        INSERT INTO event_sessions (event_id, venue, date, start_time, end_time)
        SELECT id, venue, date, start_time, end_time
        FROM events
        WHERE venue IS NOT NULL AND date IS NOT NULL
          AND start_time IS NOT NULL AND end_time IS NOT NULL
        """
    )


def downgrade() -> None:
    op.drop_index("ix_event_sessions_venue_date", table_name="event_sessions")
    op.drop_index("ix_event_sessions_date", table_name="event_sessions")
    op.drop_index("ix_event_sessions_event_id", table_name="event_sessions")
    op.drop_table("event_sessions")
