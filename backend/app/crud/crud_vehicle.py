from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from app.models.vehicle import Vehicle as VehicleModel
from app.schemas.vehicle import VehicleCreate, VehicleUpdate
from .base import CRUDBase

class CRUDVehicle(CRUDBase[VehicleModel, VehicleCreate, VehicleUpdate]):
    def get_multi_by_warehouse(self, db: Session, *, warehouse_id: Optional[uuid.UUID] = None) -> List[VehicleModel]:
        q = db.query(self.model)
        if warehouse_id:
            q = q.filter(self.model.warehouse_id == warehouse_id)
        return q.all()


vehicle = CRUDVehicle(VehicleModel)
