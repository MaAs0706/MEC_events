from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException

from sqlalchemy.orm import Session
from app.utils.jwt import create_access_token

from app.dependencies import get_db
from app.models.user import User
from app.schemas.user import UserRegister
from app.utils.security import hash_password
from app.schemas.user import UserLogin
from app.utils.security import verify_password

from app.dependencies import get_current_user
router = APIRouter(prefix="/auth")

@router.get("/me")
def get_me(
    current_user: User = Depends(
        get_current_user
    )
):

    return {
        "id": current_user.id,
        "name": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role
    }

@router.post("/login")
def login_user(
    user: UserLogin,
    db: Session = Depends(get_db)
):

    existing_user = (
        db.query(User)
        .filter(User.email == user.email)
        .first()
    )

    if not existing_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not verify_password(
        user.password,
        existing_user.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    access_token = create_access_token(
        {
            "user_id": existing_user.id,
            "role": existing_user.role
        }
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": existing_user.role,
        "full_name": existing_user.full_name,
    }


@router.post("/register")
def register_user(
    user: UserRegister,
    db: Session = Depends(get_db)
):

    existing_user = (
        db.query(User)
        .filter(User.email == user.email)
        .first()
    )



    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    new_user = User(
        full_name=user.full_name,
        email=user.email,
        password_hash=hash_password(
            user.password
        ),
        role="student"
    )

    db.add(new_user)

    db.commit()

    db.refresh(new_user)

    return {
        "message": "Student account created successfully"
    }