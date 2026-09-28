"""Admin/approver management of the official approval-letter template."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.dependencies import get_db, require_role
from app.models.letter_template import LetterTemplate
from app.schemas.letter_template import LetterTemplateUpdate
from app.utils.media_storage import MediaStorageError, upload_image


router = APIRouter(prefix="/letter-template")
MAX_IMAGE_BYTES = 5 * 1024 * 1024
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}


def get_or_create_template(db: Session) -> LetterTemplate:
    template = db.query(LetterTemplate).first()
    if template:
        return template
    template = LetterTemplate()
    db.add(template)
    db.commit()
    db.refresh(template)
    return template


def serialize(template: LetterTemplate) -> dict:
    return {
        "id": template.id,
        "college_name": template.college_name,
        "college_logo_url": template.college_logo_url,
        "club_logo_url": template.club_logo_url,
        "signatory_name": template.signatory_name,
        "signatory_title": template.signatory_title,
        "signature_url": template.signature_url,
        "reference_prefix": template.reference_prefix,
        "body_text": template.body_text,
        "updated_at": template.updated_at,
    }


@router.get("")
def get_template(
    current_user=Depends(require_role(["admin", "approver"])),
    db: Session = Depends(get_db),
):
    return serialize(get_or_create_template(db))


@router.patch("")
def update_template(
    changes: LetterTemplateUpdate,
    current_user=Depends(require_role(["admin", "approver"])),
    db: Session = Depends(get_db),
):
    template = get_or_create_template(db)
    for key, value in changes.model_dump(exclude_unset=True).items():
        setattr(template, key, value)
    template.updated_at = datetime.now(timezone.utc).isoformat()
    db.commit()
    db.refresh(template)
    return serialize(template)


@router.post("/assets/{asset}")
def upload_template_asset(
    asset: str,
    file: UploadFile = File(...),
    current_user=Depends(require_role(["admin", "approver"])),
    db: Session = Depends(get_db),
):
    fields = {
        "college-logo": ("college_logo_url", "college_logo_public_id"),
        "club-logo": ("club_logo_url", "club_logo_public_id"),
        "signature": ("signature_url", "signature_public_id"),
    }
    if asset not in fields:
        raise HTTPException(status_code=404, detail="Unknown letter template asset")
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Use a JPEG, PNG, or WebP image")
    contents = file.file.read(MAX_IMAGE_BYTES + 1)
    if not contents or len(contents) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=400, detail="Image must be smaller than 5MB")
    try:
        uploaded = upload_image(contents, "nexus/letter-template")
    except MediaStorageError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    template = get_or_create_template(db)
    url_field, id_field = fields[asset]
    # Do not delete the replaced Cloudinary asset: approved-event snapshots may
    # still refer to it and must remain reproducible.
    setattr(template, url_field, uploaded["url"])
    setattr(template, id_field, uploaded["public_id"])
    template.updated_at = datetime.now(timezone.utc).isoformat()
    db.commit()
    db.refresh(template)
    return serialize(template)
