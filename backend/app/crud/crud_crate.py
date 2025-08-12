from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.crate import Crate
from app.schemas.crate import CrateCreate, CrateUpdate


class CRUDCrate(CRUDBase[Crate, CrateCreate, CrateUpdate]):
    def create(self, db: Session, *, obj_in: CrateCreate) -> Crate:
        # QR code should encode the crate name so scans show the human-readable code
        qr_code_data = obj_in.name
        kwargs = {
            'name': obj_in.name,
            'type': obj_in.type,
            'qr_code': qr_code_data,
            'warehouse_id': obj_in.warehouse_id,
        }
        # If status provided by API, include it; otherwise let column default apply
        if getattr(obj_in, 'status', None) is not None:
            kwargs['status'] = obj_in.status
        db_obj = Crate(**kwargs)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj


crate = CRUDCrate(Crate)
