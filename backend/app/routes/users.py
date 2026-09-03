from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.dependencies import require_role
from app.models.event import Event
from app.models.registration import Registration
from app.models.user import User
from app.schemas.user import UserCreate
from app.schemas.user import UserRoleUpdate
from app.utils.security import hash_password


router = APIRouter(prefix="/users")

ALLOWED_ROLES = [
    "student",
    "coordinator",
    "approver",
    "admin"
]


@router.get("")
def get_users(
    current_user: User = Depends(
        require_role(["admin"])
    ),
    db: Session = Depends(get_db)
):
    users = db.query(User).all()

    return [
        {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role
        }
        for user in users
    ]


@router.post("")
def create_user(
    user_create: UserCreate,
    current_user: User = Depends(
        require_role(["admin"])
    ),
    db: Session = Depends(get_db)
):
    if user_create.role not in ALLOWED_ROLES:
        raise HTTPException(
            status_code=400,
            detail="Invalid role"
        )

    existing_user = (
        db.query(User)
        .filter(User.email == user_create.email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    new_user = User(
        full_name=user_create.full_name,
        email=user_create.email,
        password_hash=hash_password(
            user_create.password
        ),
        role=user_create.role,
        class_name=user_create.class_name,
        phone=user_create.phone
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "id": new_user.id,
        "full_name": new_user.full_name,
        "email": new_user.email,
        "role": new_user.role
    }


@router.patch("/{user_id}/role")
def update_user_role(
    user_id: int,
    role_update: UserRoleUpdate,
    current_user: User = Depends(
        require_role(["admin"])
    ),
    db: Session = Depends(get_db)
):
    if role_update.role not in ALLOWED_ROLES:
        raise HTTPException(
            status_code=400,
            detail="Invalid role"
        )

    if (
        user_id == current_user.id
        and role_update.role != current_user.role
    ):
        raise HTTPException(
            status_code=400,
            detail="You cannot change your own role"
        )

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    if (
        user.role == "admin"
        and role_update.role != "admin"
        and db.query(User).filter(User.role == "admin").count() == 1
    ):
        raise HTTPException(
            status_code=400,
            detail="At least one admin account must remain"
        )

    user.role = role_update.role

    db.commit()
    db.refresh(user)

    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "role": user.role
    }


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    current_user: User = Depends(
        require_role(["admin"])
    ),
    db: Session = Depends(get_db)
):
    if user_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot delete your own account"
        )

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    has_event_history = (
        db.query(Event)
        .filter(
            (Event.created_by == user.id)
            | (Event.reviewed_by == user.id)
        )
        .first()
        is not None
    )
    has_registration_history = (
        db.query(Registration)
        .filter(Registration.student_id == user.id)
        .first()
        is not None
    )

    if has_event_history or has_registration_history:
        raise HTTPException(
            status_code=400,
            detail=(
                "Users with event or registration history cannot be removed. "
                "Archive or deactivate the account instead."
            )
        )

    db.delete(user)
    db.commit()

    return {
        "message": "User deleted successfully"
    }
