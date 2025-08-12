import uuid
from pydantic import BaseModel
from decimal import Decimal
from typing import List, Optional
from uuid import UUID
from app.schemas.store_products import StoreProduct as StoreProductSchema

class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    sku: str
    price: float

class ProductCreate(ProductBase):
    vendor_id: UUID

class ProductUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    price: Decimal | None = None

class Product(ProductBase):
    id: UUID
    store_products: List[StoreProductSchema] = []

    class Config:
        from_attributes = True