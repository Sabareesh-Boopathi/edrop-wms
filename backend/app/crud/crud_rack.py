# filepath: backend/app/crud/crud_rack.py
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from fastapi import HTTPException
from app.crud.base import CRUDBase
from app.models.rack import Rack as RackModel
from app.models.bin import Bin as BinModel
from app.schemas.rack import RackCreateRequest, RackUpdate
from app.crud.crud_config import config as cfg

class CRUDRack(CRUDBase[RackModel, RackCreateRequest, RackUpdate]):
    def get_by_warehouse(self, db: Session, warehouse_id) -> List[RackModel]:
        return db.query(RackModel).filter(RackModel.warehouse_id == warehouse_id).all()

    def create(self, db: Session, *, obj_in: RackCreateRequest) -> RackModel:
        # Atomically consume next rack seq
        wh_cfg, seq = cfg.consume_next_rack_seq(db, str(obj_in.warehouse_id))
        rack_prefix = (wh_cfg.get('rackPrefix') or 'R').upper()
        name = f"{rack_prefix}{str(seq).zfill(3)}"
        # Pull system default rack status if not provided
        system_cfg = cfg.get_system(db)
        default_rack_status = (system_cfg or {}).get('defaultRackStatus') or 'active'
        db_obj = RackModel(
            name=name,
            warehouse_id=obj_in.warehouse_id,
            stacks=obj_in.stacks,
            bins_per_stack=obj_in.bins_per_stack,
            description=obj_in.description,
            status=obj_in.status or default_rack_status
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def with_stats(self, db: Session, rack: RackModel) -> dict:
        total_bins = int((rack.stacks or 0) * (rack.bins_per_stack or 0))
        occupied = db.query(func.count(BinModel.id)).filter(
            BinModel.rack_id == rack.id,
            or_(
                BinModel.status.in_(['occupied', 'reserved', 'blocked', 'maintenance']),
                BinModel.crate_id.isnot(None)
            )
        ).scalar() or 0
        return {
            'id': str(rack.id),
            'name': rack.name,
            'warehouse_id': str(rack.warehouse_id),
            'stacks': rack.stacks,
            'bins_per_stack': rack.bins_per_stack,
            'description': rack.description,
            'status': rack.status,
            'total_bins': total_bins,
            'occupied_bins': int(occupied),
        }

    def list_with_stats_by_warehouse(self, db: Session, warehouse_id) -> List[dict]:
        racks = self.get_by_warehouse(db, warehouse_id)
        return [self.with_stats(db, r) for r in racks]

rack = CRUDRack(RackModel)
