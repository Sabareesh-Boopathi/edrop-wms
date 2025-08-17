from app.models.warehouse import Warehouse
from app.models.store_products import StoreProduct
from app.models.product import Product
from app.models.store import Store, store_warehouse_association
from sqlalchemy import func, asc, desc
from app.schemas.warehouse import WarehouseCreate, WarehouseUpdate
from app.services.milestone_service import check_and_create_milestone, MilestoneEventType, MilestoneEntityType
from .base import CRUDBase
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from fastapi import HTTPException
from sqlalchemy.orm import joinedload
import uuid

class CRUDWarehouse(CRUDBase[Warehouse, WarehouseCreate, WarehouseUpdate]):
    
    def create(self, db: Session, *, obj_in: WarehouseCreate) -> Warehouse:
        try:
            db_obj = self.model(**obj_in.dict())
            db.add(db_obj)

            # Create a milestone for every warehouse addition
            check_and_create_milestone(
                db,
                event_type=MilestoneEventType.WAREHOUSE_CREATED,
                entity_type=MilestoneEntityType.SYSTEM,
                entity_id=str(db_obj.id),
                current_count=1,  # Default value for current_count
                description="🏗️ A new warehouse has been added to the eco-system! 🏢",
                title="Warehouse creation milestone",  # Added title
                milestone_type="warehouse_creation"  # Ensure milestone_type is passed
            )

            db.commit()  # Commit only after all operations are successful
            db.refresh(db_obj)
            return db_obj
        except IntegrityError as e:
            db.rollback()  # Rollback the transaction on error
            raise HTTPException(
                status_code=400,
                detail="A warehouse with the same name and address already exists."
            )
        except SQLAlchemyError as e:
            db.rollback()  # Rollback the transaction on error
            raise e

    def create_warehouse_milestone(
        db: Session,
        *,
        warehouse_id: str,
        current_count: int,
        description: str,
        title: str,
        milestone_type: str
    ):
        """
        Create a milestone specific to a warehouse.
        """
        check_and_create_milestone(
            db,
            event_type=MilestoneEventType.WAREHOUSE_USER_COUNT,
            entity_type=MilestoneEntityType.WAREHOUSE,
            entity_id=warehouse_id,
            current_count=current_count,
            description=description,
            title=title,
            milestone_type=milestone_type,
            warehouse_id=warehouse_id
        )

    def update(self, db: Session, *, db_obj: Warehouse, obj_in: WarehouseUpdate) -> Warehouse:
        update_data = obj_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_with_crates(self, db: Session, *, id: uuid.UUID) -> Warehouse:
        return db.query(Warehouse).filter(Warehouse.id == id).options(joinedload(Warehouse.crates)).first()

    def get_products(
        self,
        db: Session,
        *,
        warehouse_id: uuid.UUID,
        skip: int = 0,
        limit: int = 25,
        sort_by: str = "product_name",
        sort_dir: str = "asc",
        q: str | None = None,
    ):
        """Return paginated inventory rows for a warehouse with optional search and sorting."""
        base_query = (
            db.query(
                StoreProduct.id.label("id"),
                StoreProduct.store_id.label("store_id"),
                StoreProduct.product_id.label("product_id"),
                StoreProduct.available_qty.label("available_qty"),
                StoreProduct.price.label("price"),
                StoreProduct.bin_code.label("bin_code"),
                Product.name.label("product_name"),
                Store.store_name.label("store_name"),
            )
            .join(Store, StoreProduct.store_id == Store.id)
            .join(store_warehouse_association, Store.id == store_warehouse_association.c.store_id)
            .join(Product, StoreProduct.product_id == Product.id)
            .filter(store_warehouse_association.c.warehouse_id == warehouse_id)
        )

        if q:
            like = f"%{q.lower()}%"
            base_query = base_query.filter(
                func.lower(Product.name).like(like)
                | func.lower(Store.store_name).like(like)
                | func.lower(func.coalesce(StoreProduct.bin_code, "")).like(like)
            )

        sort_map = {
            "product_name": Product.name,
            "store_name": Store.store_name,
            "available_qty": StoreProduct.available_qty,
            "price": StoreProduct.price,
            "bin_code": StoreProduct.bin_code,
        }
        col = sort_map.get(sort_by, Product.name)
        orderer = asc if sort_dir.lower() == "asc" else desc
        base_query = base_query.order_by(orderer(col))

        # Total before pagination
        count_q = (
            db.query(func.count(StoreProduct.id))
            .join(Store, StoreProduct.store_id == Store.id)
            .join(store_warehouse_association, Store.id == store_warehouse_association.c.store_id)
            .join(Product, StoreProduct.product_id == Product.id)
            .filter(store_warehouse_association.c.warehouse_id == warehouse_id)
        )
        if q:
            like = f"%{q.lower()}%"
            count_q = count_q.filter(
                func.lower(Product.name).like(like)
                | func.lower(Store.store_name).like(like)
                | func.lower(func.coalesce(StoreProduct.bin_code, "")).like(like)
            )
        total = count_q.scalar() or 0

        rows = base_query.offset(skip).limit(limit).all()
        items = [
            {
                "id": r.id,
                "store_id": r.store_id,
                "product_id": r.product_id,
                "available_qty": int(r.available_qty) if r.available_qty is not None else 0,
                "price": float(r.price) if r.price is not None else 0.0,
                "bin_code": r.bin_code,
                "product_name": r.product_name,
                "store_name": r.store_name,
            }
            for r in rows
        ]
        return {"items": items, "total": int(total)}

warehouse = CRUDWarehouse(Warehouse)