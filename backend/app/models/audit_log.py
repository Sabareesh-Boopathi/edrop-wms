from sqlalchemy import Column, DateTime, ForeignKey, String, JSON
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid

from app.db.base_class import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    actor_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    entity_type = Column(String, nullable=False)  # e.g., 'system_config' | 'warehouse_config'
    entity_id = Column(String, nullable=True)     # warehouse_id for warehouse_config
    action = Column(String, nullable=False)       # 'update'
    changes = Column(JSON, nullable=False, default=dict)  # { field: { before, after } }
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
