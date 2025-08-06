# filepath: app/schemas/store_product.py
import uuid
from pydantic import BaseModel
from decimal import Decimal
from datetime import datetime

class StoreProductBase(BaseModel):
    store_id: uuid.UUID
    product_id: uuid.UUID
    available_qty: int
    price: Decimal
    bin_code: str | None = None  # e.g., A1-B2-R03 (for visual mapping)

class StoreProductCreate(StoreProductBase):
    pass

class StoreProductUpdate(BaseModel):
    available_qty: int | None = None
    price: Decimal | None = None
    bin_code: str | None = None

class StoreProduct(StoreProductBase):
    id: uuid.UUID
    updated_at: datetime | None = None

    class Config:
        from_attributes = True
