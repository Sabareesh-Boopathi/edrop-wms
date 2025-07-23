import uuid
from pydantic import BaseModel
from decimal import Decimal

class ProductBase(BaseModel):
    name: str
    description: str | None = None
    sku: str
    price: Decimal
    vendor_id: uuid.UUID

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    price: Decimal | None = None

class Product(ProductBase):
    id: uuid.UUID
    class Config:
        from_attributes = True