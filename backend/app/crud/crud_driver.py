from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from app.models.driver import Driver as DriverModel
from app.schemas.driver import DriverCreate, DriverUpdate
from .base import CRUDBase

class CRUDDriver(CRUDBase[DriverModel, DriverCreate, DriverUpdate]):
    def get_multi_by_warehouse(self, db: Session, *, warehouse_id: Optional[uuid.UUID] = None) -> List[DriverModel]:
        q = db.query(self.model)
        if warehouse_id:
            q = q.filter(self.model.warehouse_id == warehouse_id)
        return q.all()


driver = CRUDDriver(DriverModel)
