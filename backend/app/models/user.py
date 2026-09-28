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