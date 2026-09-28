"""Database, authentication, and role dependencies."""

import os

from dotenv import load_dotenv
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.user import User
from app.utils.session import ACCESS_COOKIE_NAME


# Bearer support remains for API documentation, tests, and non-browser clients.
# Browser clients use the HttpOnly cookie instead.
security = HTTPBearer(auto_error=False)

load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")

if not SECRET_KEY or not ALGORITHM:
    raise RuntimeError("JWT configuration is missing")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _credentials_exception() -> HTTPException:
    return HTTPException(status_code=401, detail="Invalid or expired session")


def _request_token(
    request: Request,
    bearer: HTTPAuthorizationCredentials | None,
) -> str | None:
    """Prefer explicit API Bearer credentials, then browser cookie session."""
    if bearer is not None:
        return bearer.credentials
    return request.cookies.get(ACCESS_COOKIE_NAME)


def _user_from_token(token_value: str | None, db: Session) -> User:
    credentials_exception = _credentials_exception()
    if not token_value:
        raise credentials_exception

    try:
        payload = jwt.decode(token_value, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=401, detail="Account has been deactivated")
    if payload.get("token_version") != user.token_version:
        raise credentials_exception
    return user


def get_current_user(
    request: Request,
    bearer: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
):
    return _user_from_token(_request_token(request, bearer), db)


def get_optional_current_user(
    request: Request,
    bearer: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
):
    """Return the signed-in user for a valid bearer token or cookie, else None."""
    token_value = _request_token(request, bearer)
    if token_value is None:
        return None
    return _user_from_token(token_value, db)


def require_role(allowed_roles: list[str]):
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(status_code=403, detail="You do not have permission to access this resource")
        return current_user

    return role_checker
