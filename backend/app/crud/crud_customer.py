from typing import Optional
from sqlalchemy.orm import Session
from app.models.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerUpdate
from .base import CRUDBase

class CRUDCustomer(CRUDBase[Customer, CustomerCreate, CustomerUpdate]):
    def get_by_user_id(self, db: Session, user_id: str) -> Optional[Customer]:
        return db.query(Customer).filter(Customer.user_id == user_id).first()

customer = CRUDCustomer(Customer)