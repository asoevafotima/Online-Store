from sqlalchemy.orm import Session
from notification.model import Notification

def get_notifications(db: Session, user_id: int):
    return db.query(Notification).filter(Notification.user_id == user_id).order_by(Notification.created_at.desc()).all()

def get_unread_notifications(db: Session, user_id: int):
    return db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.is_read == False
    ).order_by(Notification.created_at.asc()).all()

def mark_as_read(db: Session, notification_id: int, user_id: int):
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == user_id
    ).first()
    if not notif:
        return None
    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return notif

def create_notification(db: Session, user_id: int, message: str):
    notif = Notification(user_id=user_id, message=message)
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif