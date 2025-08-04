# filepath: c:\Users\priya\Projects\eDrop-UrbanHive\edrop-wms\backend\app\crud\crud_vendor.py
from .base import CRUDBase
from app.models.vendor import Vendor
from app.schemas.vendor import VendorCreate, VendorUpdate
from app.services.milestone_service import check_and_create_milestone, MilestoneEventType, MilestoneEntityType

from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
import uuid

class CRUDVendor(CRUDBase[Vendor, VendorCreate, VendorUpdate]):
    def create(self, db: Session, *, obj_in: VendorCreate) -> Vendor:
        try:
            db_obj = self.model(**obj_in.dict())
            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)

            # Check for vendor count milestones
            total_vendors = self.get_multi(db)
            check_and_create_milestone(
                db,
                event_type=MilestoneEventType.VENDOR_COUNT,
                entity_type=MilestoneEntityType.SYSTEM,
                entity_id=None,
                current_count=len(total_vendors),
                description=f"🎉 The {len(total_vendors)}th vendor has joined the platform!",
            )

            return db_obj
        except SQLAlchemyError as e:
            db.rollback()
            raise e
    
    def get_by_user(self, db: Session, *, user_id: uuid.UUID) -> Vendor | None:
        return db.query(self.model).filter(self.model.user_id == user_id).first()
    pass

vendor = CRUDVendor(Vendor)