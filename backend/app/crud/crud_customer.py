from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from app.models.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerUpdate
from .base import CRUDBase
from app.services.milestone_service import check_and_create_milestone, MilestoneEventType, MilestoneEntityType

class CRUDCustomer(CRUDBase[Customer, CustomerCreate, CustomerUpdate]):

    def create(self, db: Session, *, obj_in: CustomerCreate) -> Customer:
        try:
            db_obj = self.model(**obj_in.dict())
            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)

            # Check for customer count milestones
            total_customers = self.get_multi(db)
            check_and_create_milestone(
                db,
                event_type=MilestoneEventType.CUSTOMER_COUNT,
                entity_type=MilestoneEntityType.SYSTEM,
                entity_id=None,
                current_count=len(total_customers),
                description=f"🎉 The {len(total_customers)}th customer has joined the platform!",
            )

            return db_obj
        except SQLAlchemyError as e:
            db.rollback()
            raise e
    
    def get_by_user_id(self, db: Session, user_id: str) -> Optional[Customer]:
        return db.query(Customer).filter(Customer.user_id == user_id).first()

customer = CRUDCustomer(Customer)