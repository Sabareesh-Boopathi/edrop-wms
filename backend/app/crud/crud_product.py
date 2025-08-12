from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate
from .base import CRUDBase
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from app.models.store_products import StoreProduct
from app.services.milestone_service import check_and_create_milestone, MilestoneEventType, MilestoneEntityType
from app.models.vendor import Vendor
import uuid

class CRUDProduct(CRUDBase[Product, ProductCreate, ProductUpdate]):
    def create(self, db: Session, *, obj_in: ProductCreate) -> Product:
        try:
            db_obj = self.model(**obj_in.dict())
            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)

            # System-level product count milestone (reuse VENDOR_COUNT event type to avoid enum change)
            total_products = db.query(Product).count()
            check_and_create_milestone(
                db,
                event_type=MilestoneEventType.VENDOR_COUNT,
                entity_type=MilestoneEntityType.SYSTEM,
                entity_id=str(db_obj.id),
                current_count=total_products,
                description=f"📦 Platform now has {total_products} products!",
                title="Product Milestone",
                milestone_type="product_count",
            )

            # Vendor-level product count milestone
            if db_obj.vendor_id:
                vendor_products = db.query(Product).filter(Product.vendor_id == db_obj.vendor_id).count()
                vendor = db.query(Vendor).get(db_obj.vendor_id)
                vendor_name = vendor.business_name if vendor else "Vendor"
                check_and_create_milestone(
                    db,
                    event_type=MilestoneEventType.VENDOR_COUNT,
                    entity_type=MilestoneEntityType.VENDOR,
                    entity_id=str(db_obj.vendor_id),
                    current_count=vendor_products,
                    description=f"📦 {vendor_name} now lists {vendor_products} products!",
                    title=f"{vendor_name} Product Milestone",
                    milestone_type="vendor_product_count",
                )

            return db_obj
        except SQLAlchemyError as e:
            db.rollback()
            raise e

    def get_stores(self, db: Session, *, product_id: uuid.UUID) -> list[StoreProduct]:
        return db.query(StoreProduct).filter(StoreProduct.product_id == product_id).all()

product = CRUDProduct(Product)