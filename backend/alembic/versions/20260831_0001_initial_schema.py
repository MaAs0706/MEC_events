"""Create the initial NEXUS schema.

Revision ID: 20260831_0001
Revises:
Create Date: 2026-08-31
"""

from alembic import op
import sqlalchemy as sa


revision = "20260831_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("full_name", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=False, unique=True),
        sa.Column("password_hash", sa.String(), nullable=False),
        sa.Column("role", sa.String(), nullable=False),
    )
    op.create_index("ix_users_id", "users", ["id"])

    op.create_table(
        "venues",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False, unique=True),
        sa.Column("capacity", sa.Integer(), nullable=False),
    )
    op.create_index("ix_venues_id", "venues", ["id"])

    op.create_table(
        "events",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String()),
        sa.Column("description", sa.Text()),
        sa.Column("category", sa.String()),
        sa.Column("venue", sa.String()),
        sa.Column("date", sa.String()),
        sa.Column("start_time", sa.String()),
        sa.Column("end_time", sa.String()),
        sa.Column("status", sa.String()),
        sa.Column("rejection_reason", sa.Text()),
        sa.Column("reviewed_by", sa.Integer(), sa.ForeignKey("users.id")),
        sa.Column("reviewed_at", sa.String()),
        sa.Column("organizer", sa.String()),
        sa.Column("created_by", sa.Integer(), sa.ForeignKey("users.id")),
        sa.Column("attendees", sa.Integer()),
        sa.Column("capacity", sa.Integer()),
        sa.Column("image", sa.String()),
    )
    op.create_index("ix_events_id", "events", ["id"])

    op.create_table(
        "registrations",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("event_id", sa.Integer(), sa.ForeignKey("events.id"), nullable=False),
        sa.Column("student_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.UniqueConstraint(
            "event_id",
            "student_id",
            name="unique_event_student_registration",
        ),
    )
    op.create_index("ix_registrations_id", "registrations", ["id"])

    op.bulk_insert(
        sa.table(
            "venues",
            sa.column("name", sa.String()),
            sa.column("capacity", sa.Integer()),
        ),
        [
            {"name": "Main Auditorium", "capacity": 500},
            {"name": "Seminar Hall", "capacity": 120},
            {"name": "Tech Lab", "capacity": 80},
            {"name": "Sports Complex", "capacity": 800},
        ],
    )


def downgrade() -> None:
    op.drop_index("ix_registrations_id", table_name="registrations")
    op.drop_table("registrations")
    op.drop_index("ix_events_id", table_name="events")
    op.drop_table("events")
    op.drop_index("ix_venues_id", table_name="venues")
    op.drop_table("venues")
    op.drop_index("ix_users_id", table_name="users")
    op.drop_table("users")
