from app.models.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerUpdate
from .base import CRUDBase

class CRUDCustomer(CRUDBase[Customer, CustomerCreate, CustomerUpdate]):
    pass

customer = CRUDCustomer(Customer)