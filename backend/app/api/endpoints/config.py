from fastapi import APIRouter, Depends, HTTPException
import logging
from sqlalchemy.orm import Session
from app.api import deps
from app.crud.crud_config import config as crud_config
from app.crud.crud_audit import audit as crud_audit
from app.schemas.audit_log import AuditLog as AuditLogSchema
from app.schemas.config import SystemConfigSchema, WarehouseConfigSchema
from app.models.user import User

router = APIRouter()
logger = logging.getLogger("app.api.endpoints.config")

@router.get("/system/config", response_model=SystemConfigSchema)
def get_system_config(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    data = crud_config.get_system(db)
    if not data:
        # return sensible defaults if not set, aligned with frontend
        logger.info("ℹ️ System config not found; returning defaults")
        return SystemConfigSchema(
            appName="eDrop WMS",
            defaultTimeZone="Asia/Kolkata",
            dateFormat="DD-MM-YYYY",
            timeFormat="24h",
            defaultLanguage="en",
            defaultRackStatus="active",
            inboundOversPolicy={"hold_days": 3, "after": "DISPOSE"},
        )
    # Pass-through any inbound policy if present
    return SystemConfigSchema(**data)

@router.put("/system/config", response_model=SystemConfigSchema)
def put_system_config(
    payload: SystemConfigSchema,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
):
    logger.info("🛠️ Updating system config by user=%s", current_user.id)
    saved = crud_config.upsert_system(db, data=payload.model_dump(), actor_user_id=str(current_user.id))
    return SystemConfigSchema(**saved)

@router.get("/warehouses/{warehouse_id}/config", response_model=WarehouseConfigSchema)
def get_warehouse_config(
    warehouse_id: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    data = crud_config.get_warehouse(db, warehouse_id)
    if not data:
        logger.warning("❌ Warehouse config not found for %s", warehouse_id)
        raise HTTPException(status_code=404, detail="Config not found")
    # backfill optional fields for older rows
    if 'nextReceiptSeq' not in data:
        data['nextReceiptSeq'] = 1
    if 'receiptPrefix' not in data:
        # default to 'RCPT' if not configured
        data['receiptPrefix'] = 'RCPT'
    return WarehouseConfigSchema(**data)

@router.put("/warehouses/{warehouse_id}/config", response_model=WarehouseConfigSchema)
def put_warehouse_config(
    warehouse_id: str,
    payload: WarehouseConfigSchema,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
):
    logger.info("🛠️ Updating warehouse %s config by user=%s", warehouse_id, current_user.id)
    saved = crud_config.upsert_warehouse(db, warehouse_id, data=payload.model_dump(), actor_user_id=str(current_user.id))
    return WarehouseConfigSchema(**saved)

@router.get("/system/audit", response_model=list[AuditLogSchema])
def get_system_audit(
    limit: int = 100,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    # Role handling: ADMIN full; MANAGER scoped; VIEWER/OPERATOR denied
    role = str(getattr(current_user, "role", "")).upper()
    if role not in {"ADMIN", "MANAGER"}:
        raise HTTPException(status_code=403, detail="Not authorized to view audit logs")

    warehouse_id = getattr(current_user, "warehouse_id", None)
    records = crud_audit.list_scoped(db, limit=limit, role=role, warehouse_id=str(warehouse_id) if warehouse_id else None)
    result = []
    for rec in records:
        # Convert UUID fields to str for Pydantic
        data = {
            'id': str(rec.id),
            'actor_user_id': str(rec.actor_user_id),
            'entity_type': rec.entity_type,
            'entity_id': rec.entity_id,
            'action': rec.action,
            'changes': rec.changes,
            'created_at': rec.created_at,
        }
        result.append(AuditLogSchema(**data))
    return result
