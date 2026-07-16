import os

from dotenv import load_dotenv

from app.database import SessionLocal
from fastapi import Depends
from fastapi import HTTPException
from fastapi.security import HTTPBearer
from jose import jwt
from jose import JWTError
from app.models.user import User


security = HTTPBearer()

load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")

def get_db():

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()

def get_current_user(

    token = Depends(security),

    db:Session = Depends(get_db)

):

    credentials_exception = HTTPException(
        status_code=401,
        detail="Invalid token"
    )

    try:

        payload = jwt.decode(
            token.credentials,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )
        print(token.credentials)

        print("PAYLOAD:", payload)

        user_id = payload.get("user_id")

        if user_id is None:
            raise credentials_exception

    except JWTError as e :

        print("JWT Error:", e)
        raise credentials_exception

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise credentials_exception

    return user                