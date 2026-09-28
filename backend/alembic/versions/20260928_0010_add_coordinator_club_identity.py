"""Add coordinator-owned club identity and event logo snapshots."""
from alembic import op
import sqlalchemy as sa

revision = "20260928_0010"
down_revision = "20260928_0009"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("club_name", sa.String(length=150), nullable=True))
    op.add_column("users", sa.Column("club_logo_url", sa.String(length=1000), nullable=True))
    op.add_column("users", sa.Column("club_logo_public_id", sa.String(length=500), nullable=True))
    op.add_column("events", sa.Column("club_logo_url", sa.String(length=1000), nullable=True))


def downgrade() -> None:
    op.drop_column("events", "club_logo_url")
    op.drop_column("users", "club_logo_public_id")
    op.drop_column("users", "club_logo_url")
    op.drop_column("users", "club_name")
