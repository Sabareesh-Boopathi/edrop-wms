from __future__ import annotations
import uuid
from pydantic import BaseModel
from typing import Optional, List


class WarehouseInventoryRow(BaseModel):
    id: uuid.UUID
    store_id: uuid.UUID
    product_id: uuid.UUID
    available_qty: int
    price: float
    bin_code: Optional[str] = None
    product_name: str
    store_name: str

    class Config:
        from_attributes = True


class BatchAdjustItem(BaseModel):
    store_product_id: uuid.UUID
    available_qty: int
    reason: str


class BatchAdjustRequest(BaseModel):
    items: List[BatchAdjustItem]


class BatchAdjustResult(BaseModel):
    updated: int
