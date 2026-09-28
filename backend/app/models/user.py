from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy import Boolean

from app.database import Base


class User(Base):

    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    full_name = Column(
        String,
        nullable=False
    )

    email = Column(
        String,
        unique=True,
        nullable=False
    )

    password_hash = Column(
        String,
        nullable=False
    )

    role = Column(
        String,
        nullable=False,
        default="student"
    )

    class_name = Column(
        String,
        nullable=True
    )

    phone = Column(
        String,
        nullable=True
    )

    is_active = Column(
        Boolean,
        nullable=False,
        default=True,
        server_default="true"
    )

    # Incremented after a password reset to invalidate all previously issued
    # JWTs for this account.
    token_version = Column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )

    # A coordinator account represents its club's identity in v1.
    club_name = Column(String(150), nullable=True)
    club_logo_url = Column(String(1000), nullable=True)
    club_logo_public_id = Column(String(500), nullable=True)
