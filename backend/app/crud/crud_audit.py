from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.audit_log import AuditLog as AuditLogModel

class CRUDAudit:
    def list_recent(self, db: Session, limit: int = 100) -> List[AuditLogModel]:
        return db.query(AuditLogModel).order_by(AuditLogModel.created_at.desc()).limit(limit).all()

    def list_scoped(
        self,
        db: Session,
        *,
        limit: int = 100,
        role: str,
        warehouse_id: Optional[str] = None,
    ) -> List[AuditLogModel]:
        """Return audit logs scoped by role.

        - ADMIN: same as list_recent
        - MANAGER: include system level, common entities (vendor/store/product family), and warehouse_config for their warehouse
        - Others: return empty list by default (endpoint should already enforce access)
        """
        role_u = (role or "").upper()
        q = db.query(AuditLogModel)
        if role_u == "ADMIN":
            q = q.order_by(AuditLogModel.created_at.desc()).limit(limit)
            return q.all()

        if role_u == "MANAGER":
            common_types = [
                "vendor", "vendors",
                "store", "stores",
                "product", "products",
                "store_product",
                "system_config",
                # Include contact reveal events
                "vendor_contact_unmask",
                "customer_contact_unmask",
            ]
            # Build filter: (entity_type in common_types) OR (warehouse_config for their warehouse)
            from sqlalchemy import or_, and_
            cond_common = AuditLogModel.entity_type.in_(common_types)
            cond_wh = and_(AuditLogModel.entity_type == "warehouse_config", AuditLogModel.entity_id == str(warehouse_id or ""))
            q = q.filter(or_(cond_common, cond_wh)).order_by(AuditLogModel.created_at.desc()).limit(limit)
            return q.all()

        # default: none
        return []


audit = CRUDAudit()
