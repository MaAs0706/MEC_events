from jose import jwt
from datetime import datetime
from datetime import timedelta
from datetime import timezone
from dotenv import load_dotenv
import os

load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES")
)

expire = (
    datetime.now(timezone.utc)
    + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )
)




def create_access_token(data: dict):

    to_encode = data.copy()

    expire = (
    datetime.now(timezone.utc)
    + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )
)

    to_encode.update(
        {
            "exp": expire
        }
    )

    encoded_jwt = jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return encoded_jwt

    