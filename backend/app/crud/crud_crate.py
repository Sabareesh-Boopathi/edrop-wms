from uuid import uuid4
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.crate import Crate
from app.schemas.crate import CrateCreate, CrateUpdate


class CRUDCrate(CRUDBase[Crate, CrateCreate, CrateUpdate]):
    def create(self, db: Session, *, obj_in: CrateCreate) -> Crate:
        # Generate a unique QR code based on a new UUID
        qr_code_data = str(uuid4())
        db_obj = Crate(
            name=obj_in.name,
            type=obj_in.type,
            qr_code=qr_code_data,
            warehouse_id=obj_in.warehouse_id
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj


crate = CRUDCrate(Crate)
