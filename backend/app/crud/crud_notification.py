# filepath: backend/app/crud/crud_notification.py
from typing import List
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.notification import Notification
from app.schemas.notification import NotificationCreate, NotificationUpdate

class CRUDNotification(CRUDBase[Notification, NotificationCreate, NotificationUpdate]):
    def get_unread_count(self, db: Session, *, user_id) -> int:
        return db.query(Notification).filter(Notification.user_id == user_id, Notification.is_read == False).count()

    def get_for_user(self, db: Session, *, user_id, skip: int = 0, limit: int = 50) -> List[Notification]:
        return (
            db.query(Notification)
            .filter(Notification.user_id == user_id)
            .order_by(Notification.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

notification = CRUDNotification(Notification)
