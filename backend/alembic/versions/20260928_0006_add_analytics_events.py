"""Add privacy-conscious request analytics.

Revision ID: 20260928_0006
Revises: 20260928_0005
Create Date: 2026-09-28
"""

from alembic import op
import sqlalchemy as sa


revision = "20260928_0006"
down_revision = "20260928_0005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "analytics_events",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("path", sa.String(length=255), nullable=False),
        sa.Column("method", sa.String(length=10), nullable=False),
        sa.Column("status_code", sa.Integer(), nullable=False),
        sa.Column("duration_ms", sa.Integer(), nullable=False),
        sa.Column("visitor_hash", sa.String(length=64), nullable=True),
        sa.Column("is_error", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.create_index("ix_analytics_events_occurred_at", "analytics_events", ["occurred_at"])
    op.create_index("ix_analytics_events_path", "analytics_events", ["path"])
    op.create_index("ix_analytics_events_status_code", "analytics_events", ["status_code"])
    op.create_index("ix_analytics_events_visitor_hash", "analytics_events", ["visitor_hash"])
    op.create_index("ix_analytics_events_is_error", "analytics_events", ["is_error"])


def downgrade() -> None:
    op.drop_table("analytics_events")
