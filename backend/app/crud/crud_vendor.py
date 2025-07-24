# filepath: c:\Users\priya\Projects\eDrop-UrbanHive\edrop-wms\backend\app\crud\crud_vendor.py
from .base import CRUDBase
from app.models.vendor import Vendor
from app.schemas.vendor import VendorCreate, VendorUpdate

from sqlalchemy.orm import Session
import uuid

class CRUDVendor(CRUDBase[Vendor, VendorCreate, VendorUpdate]):
    def get_by_user(self, db: Session, *, user_id: uuid.UUID) -> Vendor | None:
        return db.query(self.model).filter(self.model.user_id == user_id).first()
    pass

vendor = CRUDVendor(Vendor)