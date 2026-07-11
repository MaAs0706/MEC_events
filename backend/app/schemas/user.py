from pydantic import BaseModel,EmailStr

class UserRegister(BaseModel):
    full_name: str
    email: EmailStr
    password: str