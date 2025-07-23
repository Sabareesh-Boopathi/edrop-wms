import uuid
from pydantic import BaseModel

class CustomerBase(BaseModel):
    phone_number: str | None = None
    user_id: uuid.UUID
    flat_id: uuid.UUID

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    phone_number: str | None = None
    flat_id: uuid.UUID | None = None

class Customer(CustomerBase):
    id: uuid.UUID
    class Config:
        from_attributes = True