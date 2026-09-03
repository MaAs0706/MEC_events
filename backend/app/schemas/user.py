from pydantic import BaseModel, EmailStr
from typing import Optional


class UserRegister(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    class_name: Optional[str] = None
    phone: Optional[str] = None


class UserCreate(UserRegister):
    role: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserRoleUpdate(BaseModel):
    role: str


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    class_name: Optional[str] = None
    phone: Optional[str] = None
