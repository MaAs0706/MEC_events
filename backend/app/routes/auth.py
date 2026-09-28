import hashlib
import os
import secrets
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

from fastapi import APIRouter, File, Response, UploadFile
from fastapi.responses import JSONResponse
from fastapi import Depends
from fastapi import HTTPException
from fastapi import Request

from sqlalchemy.orm import Session
from app.utils.jwt import create_access_token

from app.dependencies import get_db
from app.models.event import Event
from app.models.registration import Registration
from app.models.user import User
from app.models.password_reset_token import PasswordResetToken
from app.schemas.user import UserRegister
from app.utils.security import hash_password
from app.schemas.user import UserLogin
from app.schemas.user import PasswordResetConfirm
from app.schemas.user import PasswordResetRequest
from app.schemas.user import ProfileUpdate
from app.schemas.user import ClubProfileUpdate
from app.utils.security import verify_password
from app.utils.rate_limit import check_login_allowed
from app.utils.rate_limit import record_failed_login
from app.utils.rate_limit import record_successful_login
from app.utils.rate_limit import allow_password_reset_request
from app.utils.rate_limit import record_password_reset_request
from app.utils.email import send_password_reset_email
from app.utils.media_storage import MediaStorageError, upload_image
from app.utils.rate_limit import allow_upload, record_upload
from app.utils.audit import record_audit
from app.utils.session import clear_session_cookies, issue_csrf_token, set_csrf_cookie, set_session_cookies

from app.dependencies import get_current_user
router = APIRouter(prefix="/auth")

PASSWORD_RESET_MESSAGE = "If an account exists for that email, a reset link has been sent."
PASSWORD_RESET_EXPIRY_MINUTES = 15

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
        "role": current_user.role,
        "class_name": current_user.class_name,
        "phone": current_user.phone,
        "club_name": current_user.club_name,
        "club_logo_url": current_user.club_logo_url,
    }

@router.patch("/me")
def update_me(
    updates: ProfileUpdate,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db)
):
    update_data = updates.model_dump(
        exclude_unset=True,
        exclude_none=True
    )

    if "email" in update_data:
        existing = (
            db.query(User)
            .filter(User.email == update_data["email"])
            .filter(User.id != current_user.id)
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=400,
                detail="Email already in use"
            )

    for key, value in update_data.items():
        if key == "full_name":
            setattr(current_user, "full_name", value)
        else:
            setattr(current_user, key, value)

    if update_data:
        record_audit(
            db, actor_user_id=current_user.id, action="profile.updated",
            target_type="user", target_id=current_user.id,
            summary="User updated their profile.",
        )
    db.commit()
    db.refresh(current_user)

    return {
        "id": current_user.id,
        "name": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role,
        "class_name": current_user.class_name,
        "phone": current_user.phone,
        "club_name": current_user.club_name,
        "club_logo_url": current_user.club_logo_url,
    }


@router.patch("/me/club")
def update_my_club(
    update: ClubProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "coordinator":
        raise HTTPException(status_code=403, detail="Only coordinators can manage a club profile")
    current_user.club_name = update.club_name.strip()
    record_audit(
        db, actor_user_id=current_user.id, action="club.profile.updated",
        target_type="user", target_id=current_user.id,
        summary="Coordinator updated their club name.",
    )
    db.commit(); db.refresh(current_user)
    return {"club_name": current_user.club_name, "club_logo_url": current_user.club_logo_url}


@router.post("/me/club/logo")
def upload_my_club_logo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "coordinator":
        raise HTTPException(status_code=403, detail="Only coordinators can manage a club profile")
    if not allow_upload(current_user.id):
        raise HTTPException(status_code=429, detail="Too many uploads. Try again later.")
    record_upload(current_user.id)
    from app.routes.events import validate_image
    contents = validate_image(file)
    try:
        uploaded = upload_image(contents, "nexus/clubs")
    except MediaStorageError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    # Old assets are retained because a previously approved PDF can snapshot
    # its URL and must remain reproducible.
    current_user.club_logo_url = uploaded["url"]
    current_user.club_logo_public_id = uploaded["public_id"]
    record_audit(
        db, actor_user_id=current_user.id, action="club.logo.uploaded",
        target_type="user", target_id=current_user.id,
        summary="Coordinator uploaded a club logo.",
    )
    db.commit(); db.refresh(current_user)
    return {"club_name": current_user.club_name, "club_logo_url": current_user.club_logo_url}

@router.get("/me/registrations")
def get_my_registrations(
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db)
):
    return (
        db.query(Event)
        .join(
            Registration,
            Registration.event_id == Event.id
        )
        .filter(Registration.student_id == current_user.id)
        .all()
    )

@router.post("/login")
def login_user(
    user: UserLogin,
    request: Request,
    db: Session = Depends(get_db)
):

    ip = request.client.host if request.client else "unknown"

    # Reject early when this account or this IP is already rate-limited.
    blocked = check_login_allowed(user.email, ip)
    if blocked:
        raise HTTPException(
            status_code=429,
            detail=blocked
        )

    existing_user = (
        db.query(User)
        .filter(User.email == user.email)
        .first()
    )

    if not existing_user:
        record_failed_login(user.email, ip)
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not verify_password(
        user.password,
        existing_user.password_hash
    ):
        record_failed_login(user.email, ip)
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not existing_user.is_active:
        raise HTTPException(
            status_code=403,
            detail="Your account has been deactivated. Contact the administrator."
        )

    record_successful_login(user.email, ip)

    access_token = create_access_token(
        {
            "user_id": existing_user.id,
            "role": existing_user.role,
            "token_version": existing_user.token_version,
        }
    )
    csrf_token = issue_csrf_token()
    response = JSONResponse({
        "role": existing_user.role,
        "full_name": existing_user.full_name,
        "csrf_token": csrf_token,
    })
    set_session_cookies(response, access_token, csrf_token)
    return response


@router.get("/csrf")
def issue_csrf(response: Response):
    """Issue a CSRF value for an existing or freshly created browser session."""
    csrf_token = issue_csrf_token()
    set_csrf_cookie(response, csrf_token)
    return {"csrf_token": csrf_token}


@router.post("/logout")
def logout(response: Response):
    clear_session_cookies(response)
    return {"message": "Signed out"}


@router.post("/forgot-password")
def request_password_reset(
    request_data: PasswordResetRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """Issue a one-time reset token without disclosing account existence."""
    email = str(request_data.email).strip().lower()
    ip = request.client.host if request.client else "unknown"

    # A generic successful response is also returned while rate-limited.
    if not allow_password_reset_request(email, ip):
        return {"message": PASSWORD_RESET_MESSAGE}

    record_password_reset_request(email, ip)
    user = db.query(User).filter(User.email == email, User.is_active.is_(True)).first()
    if not user:
        return {"message": PASSWORD_RESET_MESSAGE}

    # A newer request supersedes any earlier link for this user.
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.used_at.is_(None),
    ).update({PasswordResetToken.used_at: datetime.now(timezone.utc)})

    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
    db.add(
        PasswordResetToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=PASSWORD_RESET_EXPIRY_MINUTES),
        )
    )
    db.commit()

    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
    reset_url = f"{frontend_url}/reset-password?{urlencode({'token': raw_token})}"
    send_password_reset_email(recipient=user.email, reset_url=reset_url)
    return {"message": PASSWORD_RESET_MESSAGE}


@router.post("/reset-password")
def reset_password(
    reset_data: PasswordResetConfirm,
    response: Response,
    db: Session = Depends(get_db),
):
    token_hash = hashlib.sha256(reset_data.token.encode("utf-8")).hexdigest()
    reset_token = db.query(PasswordResetToken).filter(
        PasswordResetToken.token_hash == token_hash,
        PasswordResetToken.used_at.is_(None),
    ).first()

    now = datetime.now(timezone.utc)
    if not reset_token or reset_token.expires_at.replace(tzinfo=timezone.utc) <= now:
        raise HTTPException(status_code=400, detail="This password reset link is invalid or has expired")

    user = db.query(User).filter(User.id == reset_token.user_id, User.is_active.is_(True)).first()
    if not user:
        raise HTTPException(status_code=400, detail="This password reset link is invalid or has expired")

    user.password_hash = hash_password(reset_data.password)
    user.token_version += 1
    reset_token.used_at = now
    # Mark every outstanding token used, ensuring only the completed request
    # can affect the account.
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.used_at.is_(None),
    ).update({PasswordResetToken.used_at: now}, synchronize_session=False)
    db.commit()
    clear_session_cookies(response)
    return {"message": "Password reset successfully. You can now sign in."}


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
        role="student",
        class_name=user.class_name,
        phone=user.phone
    )

    db.add(new_user)

    db.commit()

    db.refresh(new_user)

    return {
        "message": "Student account created successfully"
    }
