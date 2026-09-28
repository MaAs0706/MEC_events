import re

from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional


def _validate_password_strength(value: str) -> str:
    """Minimum password policy for the whole platform.

    Enforced for student self-registration and for admin-created accounts,
    because UserCreate inherits from UserRegister.
    """
    if len(value) < 8:
        raise ValueError("Password must be at least 8 characters")
    if not re.search(r"[A-Za-z]", value):
        raise ValueError("Password must contain at least one letter")
    if not re.search(r"\d", value):
        raise ValueError("Password must contain at least one number")
    return value


class UserRegister(BaseModel):
    full_name: str = Field(min_length=1, max_length=150)
    email: EmailStr
    password: str
    class_name: Optional[str] = Field(default=None, max_length=100)
    phone: Optional[str] = Field(default=None, max_length=20)

    validate_password = field_validator("password")(_validate_password_strength)


class UserCreate(UserRegister):
    role: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str = Field(min_length=32, max_length=256)
    password: str

    validate_password = field_validator("password")(_validate_password_strength)


class UserRoleUpdate(BaseModel):
    role: str


class UserStatusUpdate(BaseModel):
    """Used by admins to activate or deactivate an account."""

    is_active: bool


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=1, max_length=150)
    email: Optional[EmailStr] = None
    class_name: Optional[str] = Field(default=None, max_length=100)
    phone: Optional[str] = Field(default=None, max_length=20)
