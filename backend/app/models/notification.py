# filepath: backend/app/models/notification.py
import uuid
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base

class Notification(Base):
    __tablename__ = 'notifications'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(String(2000), nullable=True)
    is_read = Column(Boolean, nullable=False, server_default='false')
    milestone_id = Column(UUID(as_uuid=True), ForeignKey('milestones.id'), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    user = relationship('User', lazy='joined')
