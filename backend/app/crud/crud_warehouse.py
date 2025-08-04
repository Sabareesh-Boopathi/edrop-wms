from app.models.warehouse import Warehouse
from app.schemas.warehouse import WarehouseCreate, WarehouseUpdate
from app.services.milestone_service import check_and_create_milestone, MilestoneEventType, MilestoneEntityType
from .base import CRUDBase
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from fastapi import HTTPException

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
                description="🏗️ A new warehouse has been added to the system! 🏢",
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

warehouse = CRUDWarehouse(Warehouse)