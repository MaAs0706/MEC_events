"""Add post-event gallery images.

Revision ID: 20260914_0004
Revises: 20260909_0003
Create Date: 2026-09-14
"""

from alembic import op
import sqlalchemy as sa


revision = "20260914_0004"
down_revision = "20260909_0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "event_gallery_images",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "event_id",
            sa.Integer(),
            sa.ForeignKey("events.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("filename", sa.String(), nullable=False),
        sa.Column("uploaded_at", sa.String(), nullable=False),
    )
    op.create_index("ix_event_gallery_images_event_id", "event_gallery_images", ["event_id"])
    op.create_index("ix_event_gallery_images_id", "event_gallery_images", ["id"])


def downgrade() -> None:
    op.drop_index("ix_event_gallery_images_id", table_name="event_gallery_images")
    op.drop_index("ix_event_gallery_images_event_id", table_name="event_gallery_images")
    op.drop_table("event_gallery_images")
