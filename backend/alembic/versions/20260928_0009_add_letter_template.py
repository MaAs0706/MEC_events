"""Add official approval-letter template settings and snapshots."""
from alembic import op
import sqlalchemy as sa


revision = "20260928_0009"
down_revision = "20260928_0008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "letter_templates",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("college_name", sa.String(length=180), nullable=False),
        sa.Column("college_logo_url", sa.String(length=1000)),
        sa.Column("college_logo_public_id", sa.String(length=500)),
        sa.Column("club_logo_url", sa.String(length=1000)),
        sa.Column("club_logo_public_id", sa.String(length=500)),
        sa.Column("signatory_name", sa.String(length=150)),
        sa.Column("signatory_title", sa.String(length=150)),
        sa.Column("signature_url", sa.String(length=1000)),
        sa.Column("signature_public_id", sa.String(length=500)),
        sa.Column("reference_prefix", sa.String(length=50), nullable=False),
        sa.Column("body_text", sa.Text()),
        sa.Column("updated_at", sa.String(), nullable=False),
    )
    op.add_column("events", sa.Column("permission_letter_snapshot", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("events", "permission_letter_snapshot")
    op.drop_table("letter_templates")
