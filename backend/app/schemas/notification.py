# filepath: backend/app/schemas/notification.py
import uuid
from datetime import datetime
from pydantic import BaseModel

class NotificationBase(BaseModel):
    title: str
    message: str | None = None

class NotificationCreate(NotificationBase):
    user_id: uuid.UUID
    milestone_id: uuid.UUID | None = None

class NotificationUpdate(BaseModel):
    is_read: bool | None = None

class NotificationInDBBase(NotificationBase):
    id: uuid.UUID
    user_id: uuid.UUID
    is_read: bool
    milestone_id: uuid.UUID | None = None
    created_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True

class Notification(NotificationInDBBase):
    pass
