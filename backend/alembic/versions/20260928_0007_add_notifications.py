"""Add in-app notifications."""
from alembic import op
import sqlalchemy as sa
revision = "20260928_0007"
down_revision = "20260928_0006"
branch_labels = None
depends_on = None
def upgrade():
    op.create_table("notifications", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False), sa.Column("title", sa.String(length=160), nullable=False), sa.Column("message", sa.Text(), nullable=False), sa.Column("link", sa.String(length=255)), sa.Column("is_read", sa.Boolean(), nullable=False, server_default=sa.false()), sa.Column("created_at", sa.String(), nullable=False))
    op.create_index("ix_notifications_user_id", "notifications", ["user_id"])
def downgrade(): op.drop_table("notifications")
