from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel

class AuditLogBase(BaseModel):
    actor_user_id: str
    entity_type: str
    entity_id: Optional[str] = None
    action: str
    changes: Dict[str, Dict[str, Any]]
    created_at: datetime

    class Config:
        from_attributes = True

class AuditLog(AuditLogBase):
    id: str
