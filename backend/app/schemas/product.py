import uuid
from pydantic import BaseModel
from decimal import Decimal
from typing import List, Optional
from uuid import UUID

class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    sku: str
    price: float

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    price: Decimal | None = None

class Product(ProductBase):
    id: UUID
    store_products: List["StoreProduct"] = []  # Updated to reflect the relationship with StoreProduct

    class Config:
        orm_mode = True