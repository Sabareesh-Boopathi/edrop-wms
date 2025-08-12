from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import and_
from typing import Optional, Tuple
from app.models.system_config import SystemConfig
from app.models.warehouse_config import WarehouseConfig
from app.models.audit_log import AuditLog
from fastapi import HTTPException

class CRUDConfig:
    SENSITIVE_FIELDS = {'apiToken', 'passwordPolicy'}

    def _mask(self, key: str, val):
        if key in self.SENSITIVE_FIELDS and isinstance(val, str):
            return '***'
        return val

    def _diff(self, before: Optional[dict], after: dict) -> dict:
        before = before or {}
        changes = {}
        keys = set(before.keys()) | set(after.keys())
        for k in keys:
            b = before.get(k)
            a = after.get(k)
            if b != a:
                changes[k] = {'before': self._mask(k, b), 'after': self._mask(k, a)}
        return changes
    def get_system(self, db: Session) -> Optional[dict]:
        row = db.query(SystemConfig).order_by(SystemConfig.created_at.desc()).first()
        return row.data if row else None

    def upsert_system(self, db: Session, data: dict, actor_user_id: Optional[str] = None) -> dict:
        try:
            row = db.query(SystemConfig).order_by(SystemConfig.created_at.desc()).first()
            if row:
                changes = self._diff(row.data, data)
                row.data = data
                if actor_user_id and changes:
                    db.add(AuditLog(actor_user_id=actor_user_id, entity_type='system_config', entity_id=None, action='update', changes=changes))
            else:
                row = SystemConfig(data=data)
                db.add(row)
                if actor_user_id:
                    db.add(AuditLog(actor_user_id=actor_user_id, entity_type='system_config', entity_id=None, action='create', changes={k: {'before': None, 'after': self._mask(k, v)} for k, v in (data or {}).items()}))
            db.commit()
            db.refresh(row)
            return row.data
        except SQLAlchemyError as e:
            db.rollback()
            raise e

    def get_warehouse(self, db: Session, warehouse_id) -> Optional[dict]:
        row = db.query(WarehouseConfig).filter(WarehouseConfig.warehouse_id == warehouse_id).first()
        return row.data if row else None

    def upsert_warehouse(self, db: Session, warehouse_id, data: dict, actor_user_id: Optional[str] = None) -> dict:
        try:
            # Validate presence of required fields
            short_code = (data.get('shortCode') or '').strip()
            if not short_code or len(short_code) != 3 or not short_code.isalnum():
                raise HTTPException(status_code=400, detail="Short Code must be a 3-character alphanumeric value.")

            # Enforce unique short code across warehouses
            existing_with_code = (
                db.query(WarehouseConfig)
                .filter(
                    and_(
                        WarehouseConfig.warehouse_id != warehouse_id,
                        (WarehouseConfig.data['shortCode'].astext == short_code)
                    )
                )
                .first()
            )
            if existing_with_code:
                raise HTTPException(status_code=400, detail="Warehouse short code must be unique.")

            # Load current row (if any) to enforce increment-only rules
            row = db.query(WarehouseConfig).filter(WarehouseConfig.warehouse_id == warehouse_id).first()
            current = row.data if row else {}

            def clamp_seq(val: Optional[int], max_val: int) -> int:
                try:
                    v = int(val) if val is not None else 1
                except Exception:
                    v = 1
                return max(1, min(v, max_val))

            # Normalize incoming sequences to within bounds
            incoming_crate = clamp_seq(data.get('nextCrateSeq'), 9999)
            incoming_rack = clamp_seq(data.get('nextRackSeq'), 999)

            # Enforce increment-only compared to current
            if current:
                cur_crate = clamp_seq(current.get('nextCrateSeq'), 9999)
                cur_rack = clamp_seq(current.get('nextRackSeq'), 999)
                if incoming_crate < cur_crate:
                    raise HTTPException(status_code=400, detail="Crate sequence can only be increased. Decreasing may cause duplicate IDs.")
                if incoming_rack < cur_rack:
                    raise HTTPException(status_code=400, detail="Rack sequence can only be increased. Decreasing may cause duplicate IDs.")

            # Apply normalized values back into data
            data = { **data, 'nextCrateSeq': incoming_crate, 'nextRackSeq': incoming_rack }

            if row:
                changes = self._diff(row.data, data)
                row.data = data
                if actor_user_id and changes:
                    db.add(AuditLog(actor_user_id=actor_user_id, entity_type='warehouse_config', entity_id=str(warehouse_id), action='update', changes=changes))
            else:
                row = WarehouseConfig(warehouse_id=warehouse_id, data=data)
                db.add(row)
                if actor_user_id:
                    db.add(AuditLog(actor_user_id=actor_user_id, entity_type='warehouse_config', entity_id=str(warehouse_id), action='create', changes={k: {'before': None, 'after': self._mask(k, v)} for k, v in (data or {}).items()}))
            db.commit()
            db.refresh(row)
            return row.data
        except SQLAlchemyError as e:
            db.rollback()
            raise e

    # Concurrency-safe consumers
    def _lock_wh_config(self, db: Session, warehouse_id) -> WarehouseConfig:
        row = (
            db.query(WarehouseConfig)
            .filter(WarehouseConfig.warehouse_id == warehouse_id)
            .with_for_update()
            .first()
        )
        if not row:
            raise HTTPException(status_code=400, detail="Warehouse configuration missing. Please set it up in System Configuration.")
        return row

    def consume_next_crate_seq(self, db: Session, warehouse_id) -> Tuple[dict, int]:
        try:
            row = self._lock_wh_config(db, warehouse_id)
            data = row.data or {}
            short = (data.get('shortCode') or '').strip()
            if not short:
                raise HTTPException(status_code=400, detail="Warehouse short code missing. Please complete System Configuration for this warehouse.")
            # current sequence to use
            try:
                seq = int(data.get('nextCrateSeq') or 1)
            except Exception:
                seq = 1
            if seq < 1 or seq > 9999:
                seq = 1
            # compute next (wrap at 9999)
            next_seq = seq + 1
            if next_seq > 9999:
                next_seq = 1
            row.data = { **data, 'nextCrateSeq': next_seq }
            db.commit()
            db.refresh(row)
            return row.data, seq
        except SQLAlchemyError:
            db.rollback()
            raise

    def consume_next_rack_seq(self, db: Session, warehouse_id) -> Tuple[dict, int]:
        try:
            row = self._lock_wh_config(db, warehouse_id)
            data = row.data or {}
            short = (data.get('shortCode') or '').strip()
            if not short:
                raise HTTPException(status_code=400, detail="Warehouse short code missing. Please complete System Configuration for this warehouse.")
            try:
                seq = int(data.get('nextRackSeq') or 1)
            except Exception:
                seq = 1
            if seq < 1 or seq > 999:
                seq = 1
            next_seq = seq + 1
            if next_seq > 999:
                next_seq = 1
            row.data = { **data, 'nextRackSeq': next_seq }
            db.commit()
            db.refresh(row)
            return row.data, seq
        except SQLAlchemyError:
            db.rollback()
            raise

config = CRUDConfig()
