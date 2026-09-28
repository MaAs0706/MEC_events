from app.models.notification import Notification

def create_notification(db, user_id, title, message, link=None):
    if user_id is not None:
        db.add(Notification(user_id=user_id, title=title, message=message, link=link))
