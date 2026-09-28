"""Store Cloudinary public IDs for cover and gallery assets.

Revision ID: 20260928_0005
Revises: 20260914_0004
Create Date: 2026-09-28
"""

from alembic import op
import sqlalchemy as sa


revision = "20260928_0005"
down_revision = "20260914_0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("events", sa.Column("image_public_id", sa.String(), nullable=True))
    op.add_column("event_gallery_images", sa.Column("public_id", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("event_gallery_images", "public_id")
    op.drop_column("events", "image_public_id")
