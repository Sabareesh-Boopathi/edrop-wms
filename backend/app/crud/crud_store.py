from typing import Any, Dict, Optional, Union
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.store import Store
from app.models.store_products import StoreProduct
from app.schemas.store import Store as StoreSchema, StoreCreate, StoreUpdate
from app.services.milestone_service import check_and_create_milestone, MilestoneEventType, MilestoneEntityType
from app.models.vendor import Vendor
import uuid

class CRUDStore(CRUDBase[Store, StoreCreate, StoreUpdate]):
    def get_by_name(self, db: Session, *, name: str) -> Optional[Store]:
        return db.query(Store).filter(Store.store_name == name).first()

    def get_multi_by_vendor(self, db: Session, *, vendor_id: uuid.UUID) -> list[Store]:
        return db.query(Store).filter(Store.vendor_id == vendor_id).all()

    def create(self, db: Session, *, obj_in: StoreCreate) -> Store:
        db_obj = Store(**obj_in.dict(exclude={"products"}))
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)

        # Handle many-to-many relationship with StoreProduct if provided
        if hasattr(obj_in, "products") and getattr(obj_in, "products"):
            for product_data in getattr(obj_in, "products"):
                store_product = StoreProduct(
                    store_id=db_obj.id,
                    product_id=product_data.product_id,
                    available_qty=product_data.available_qty,
                    price=product_data.price,
                    bin_code=product_data.bin_code
                )
                db.add(store_product)
            db.commit()

        # Milestone creation logic (system-level store count) - reuse VENDOR_COUNT event type
        total_stores = db.query(Store).count()
        check_and_create_milestone(
            db,
            event_type=MilestoneEventType.VENDOR_COUNT,
            entity_type=MilestoneEntityType.SYSTEM,
            entity_id=str(db_obj.id),
            current_count=total_stores,
            description=f"🎉 Hurray! {total_stores} stores strong and still growing!",
            title="Store Milestone",
            milestone_type="store_count"
        )

        # Vendor-scoped store count milestone
        if db_obj.vendor_id:
            vendor_store_count = db.query(Store).filter(Store.vendor_id == db_obj.vendor_id).count()
            vendor = db.query(Vendor).get(db_obj.vendor_id)
            vendor_name = vendor.business_name if vendor else "Vendor"
            check_and_create_milestone(
                db,
                event_type=MilestoneEventType.VENDOR_COUNT,
                entity_type=MilestoneEntityType.VENDOR,
                entity_id=str(db_obj.vendor_id),
                current_count=vendor_store_count,
                description=f"🏪 {vendor_name} now has {vendor_store_count} stores!",
                title=f"{vendor_name} Store Milestone",
                milestone_type="vendor_store_count",
            )

        return db_obj

    def update(
        self,
        db: Session,
        *,
        db_obj: Store,
        obj_in: Union[StoreUpdate, Dict[str, Any]]
    ) -> Store:
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True, exclude={"products"})

        for field, value in update_data.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)

        # Update many-to-many relationship with StoreProduct if provided
        if not isinstance(obj_in, dict) and hasattr(obj_in, "products") and getattr(obj_in, "products") is not None:
            db.query(StoreProduct).filter(StoreProduct.store_id == db_obj.id).delete()
            for product_data in getattr(obj_in, "products"):
                store_product = StoreProduct(
                    store_id=db_obj.id,
                    product_id=product_data.product_id,
                    available_qty=product_data.available_qty,
                    price=product_data.price,
                    bin_code=product_data.bin_code
                )
                db.add(store_product)
        db.commit()
        db.refresh(db_obj)

        return db_obj

store = CRUDStore(Store)
