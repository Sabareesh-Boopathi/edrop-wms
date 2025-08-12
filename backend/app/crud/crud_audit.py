from sqlalchemy.orm import Session
from typing import List
from app.models.audit_log import AuditLog as AuditLogModel

class CRUDAudit:
    def list_recent(self, db: Session, limit: int = 100) -> List[AuditLogModel]:
        return db.query(AuditLogModel).order_by(AuditLogModel.created_at.desc()).limit(limit).all()


audit = CRUDAudit()
