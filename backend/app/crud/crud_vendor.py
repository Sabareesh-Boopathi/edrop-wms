# filepath: c:\Users\priya\Projects\eDrop-UrbanHive\edrop-wms\backend\app\crud\crud_vendor.py
from .base import CRUDBase
from app.models.vendor import Vendor
from app.schemas.vendor import VendorCreate, VendorUpdate
from app.services.milestone_service import check_and_create_milestone, MilestoneEventType, MilestoneEntityType
from app.models.store import Store  # Import the Store model

from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from fastapi import HTTPException
import uuid
from datetime import datetime
from typing import Union, Dict, Any

class CRUDVendor(CRUDBase[Vendor, VendorCreate, VendorUpdate]):
    def create(self, db: Session, *, obj_in: VendorCreate) -> Vendor:
        try:
            db_obj = Vendor(
                business_name=obj_in.business_name,
                registered_name=obj_in.registered_name,
                email=obj_in.email,
                phone_number=obj_in.phone_number,
                registered_address=obj_in.registered_address,
                vendor_type=obj_in.vendor_type,
                vendor_status=obj_in.vendor_status,
                password=obj_in.password,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)

            # Check for vendor count milestones
            total_vendors = len(self.get_multi(db))
            check_and_create_milestone(
                db,
                event_type=MilestoneEventType.VENDOR_COUNT,
                entity_type=MilestoneEntityType.VENDOR,
                entity_id=str(db_obj.id),
                current_count=total_vendors,
                description=f"🎉 We have just welcomed our {total_vendors}th vendor to the platform!",
                title="Vendor Milestone",
                milestone_type="vendor_count",
            )

            # Per-vendor stores count milestone (reuse VENDOR_COUNT event type with a specific milestone_type)
            vendor_store_count = db.query(Store).filter(Store.vendor_id == db_obj.id).count()
            check_and_create_milestone(
                db,
                event_type=MilestoneEventType.VENDOR_COUNT,
                entity_type=MilestoneEntityType.VENDOR,
                entity_id=str(db_obj.id),
                current_count=vendor_store_count,
                description=f"🏪 Vendor {db_obj.business_name} now has {vendor_store_count} stores!",
                title=f"{db_obj.business_name} Store Milestone",
                milestone_type="vendor_store_count",
            )

            return db_obj
        except IntegrityError as e:
            db.rollback()
            # Provide user-friendly messages based on the violated constraint
            message = "A vendor with the same unique fields already exists."
            constraint = None
            try:
                constraint = getattr(getattr(e.orig, 'diag', None), 'constraint_name', None)
            except Exception:
                constraint = None
            if constraint:
                if constraint == 'uq_vendor_name':
                    message = "Business name already exists."
                elif 'email' in constraint:
                    message = "Email already exists."
            else:
                # Fallback to parsing the error text
                txt = str(e.orig).lower()
                if 'uq_vendor_name' in txt:
                    message = "Business name already exists."
                elif 'email' in txt and ('duplicate' in txt or 'unique' in txt or 'already exists' in txt):
                    message = "Email already exists."
            raise HTTPException(status_code=400, detail=message)
        except SQLAlchemyError as e:
            db.rollback()
            raise e

    def update(
        self, db: Session, *, db_obj: Vendor, obj_in: Union[VendorUpdate, Dict[str, Any]]
    ) -> Vendor:
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True)

        for field in update_data:
            if hasattr(db_obj, field):
                setattr(db_obj, field, update_data[field])

        db_obj.updated_at = datetime.utcnow()
        try:
            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)
            return db_obj
        except IntegrityError as e:
            db.rollback()
            message = "A vendor with the same unique fields already exists."
            constraint = None
            try:
                constraint = getattr(getattr(e.orig, 'diag', None), 'constraint_name', None)
            except Exception:
                constraint = None
            if constraint:
                if constraint == 'uq_vendor_name':
                    message = "Business name already exists."
                elif 'email' in constraint:
                    message = "Email already exists."
            else:
                txt = str(e.orig).lower()
                if 'uq_vendor_name' in txt:
                    message = "Business name already exists."
                elif 'email' in txt and ('duplicate' in txt or 'unique' in txt or 'already exists' in txt):
                    message = "Email already exists."
            raise HTTPException(status_code=400, detail=message)
        except SQLAlchemyError as e:
            db.rollback()
            raise e

    def get_stores(self, db: Session, *, vendor_id: uuid.UUID) -> list[Store]:
        return db.query(Store).filter(Store.vendor_id == vendor_id).all()

vendor = CRUDVendor(Vendor)