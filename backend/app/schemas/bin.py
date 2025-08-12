# filepath: backend/app/schemas/bin.py
from typing import Optional
from pydantic import BaseModel
from uuid import UUID

class BinBase(BaseModel):
    rack_id: UUID
    stack_index: int
    bin_index: int
    code: Optional[str] = None
    status: str
    crate_id: Optional[UUID] = None
    product_id: Optional[UUID] = None
    store_product_id: Optional[UUID] = None
    quantity: Optional[int] = None

# Request payload for creating a bin via POST /racks/{rack_id}/bins
# rack_id and code are assigned server-side
class BinCreateRequest(BaseModel):
    stack_index: int
    bin_index: int
    status: str
    crate_id: Optional[UUID] = None
    product_id: Optional[UUID] = None
    store_product_id: Optional[UUID] = None
    quantity: Optional[int] = None

class BinCreate(BinBase):
    pass

class BinUpdate(BaseModel):
    stack_index: Optional[int] = None
    bin_index: Optional[int] = None
    code: Optional[str] = None
    status: Optional[str] = None
    crate_id: Optional[UUID] = None
    product_id: Optional[UUID] = None
    store_product_id: Optional[UUID] = None
    quantity: Optional[int] = None

class Bin(BinBase):
    id: UUID

    class Config:
        from_attributes = True
