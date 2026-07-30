from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.dependencies import require_role
from app.models.user import User
from app.schemas.user import UserRoleUpdate


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

    db.delete(user)
    db.commit()

    return {
        "message": "User deleted successfully"
    }
