from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.dependencies import get_db, get_current_user
from app.models.notification import Notification
from app.models.user import User

router = APIRouter(prefix="/notifications")

def serialize(row):
    return {"id": row.id, "title": row.title, "message": row.message, "link": row.link, "is_read": row.is_read, "created_at": row.created_at}

@router.get("")
def get_notifications(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(Notification).filter(Notification.user_id == current_user.id).order_by(Notification.id.desc()).limit(30).all()
    return {"items": [serialize(row) for row in rows], "unread_count": sum(not row.is_read for row in rows)}

@router.patch("/{notification_id}/read")
def mark_read(notification_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row = db.query(Notification).filter(Notification.id == notification_id, Notification.user_id == current_user.id).first()
    if not row: raise HTTPException(status_code=404, detail="Notification not found")
    row.is_read = True; db.commit(); return serialize(row)

@router.patch("/read-all")
def mark_all_read(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(Notification).filter(Notification.user_id == current_user.id, Notification.is_read.is_(False)).update({Notification.is_read: True})
    db.commit(); return {"message": "Notifications marked as read"}
