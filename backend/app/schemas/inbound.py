import uuid
from datetime import datetime
from typing import List, Optional, Literal
from pydantic import BaseModel

ReceiptStatus = Literal[
    'AWAITING_UNLOADING',
    'UNLOADING',
    'MOVED_TO_BAY',
    'ALLOCATED',
    'READY_FOR_PICKING',
    'COMPLETED',
    'CANCELLED',
]

class ReceiptLineBase(BaseModel):
    product_sku: Optional[str] = None
    product_name: Optional[str] = None
    customer_name: Optional[str] = None
    apartment: Optional[str] = None
    quantity: int
    received_qty: Optional[int] = None
    damaged: Optional[int] = None
    missing: Optional[int] = None
    ack_diff: Optional[bool] = None
    damaged_origin: Optional[Literal['UNLOADING','WAREHOUSE']] = None
    bin_id: Optional[uuid.UUID] = None
    notes: Optional[str] = None
    bin_code: Optional[str] = None

class ReceiptLineCreate(ReceiptLineBase):
    pass

class ReceiptLineUpdate(BaseModel):
    received_qty: Optional[int] = None
    damaged: Optional[int] = None
    missing: Optional[int] = None
    ack_diff: Optional[bool] = None
    damaged_origin: Optional[Literal['UNLOADING','WAREHOUSE']] = None
    bin_id: Optional[uuid.UUID] = None
    notes: Optional[str] = None

class ReceiptLine(ReceiptLineBase):
    id: uuid.UUID
    receipt_id: uuid.UUID
    class Config:
        from_attributes = True

class ReceiptBase(BaseModel):
    vendor_id: uuid.UUID
    vendor_type: Literal['SKU','FLAT']
    warehouse_id: uuid.UUID
    reference: Optional[str] = None
    planned_arrival: Optional[datetime] = None
    notes: Optional[str] = None

class ReceiptCreate(ReceiptBase):
    lines: List[ReceiptLineCreate] = []

class ReceiptUpdate(BaseModel):
    status: Optional[ReceiptStatus] = None
    actual_arrival: Optional[datetime] = None
    overs_policy: Optional[dict] = None

class Receipt(ReceiptBase):
    id: uuid.UUID
    code: str
    status: ReceiptStatus
    actual_arrival: Optional[datetime] = None
    overs_policy: Optional[dict] = None
    created_at: datetime
    updated_at: datetime
    lines: List[ReceiptLine] = []
    class Config:
        from_attributes = True

# Query filters & KPI
class ReceiptFilter(BaseModel):
    warehouse_id: Optional[uuid.UUID] = None
    vendor_type: Optional[Literal['SKU','FLAT']] = None
    status: Optional[ReceiptStatus] = None
    search: Optional[str] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None

class GoodsInKpis(BaseModel):
    totalReceipts: int
    openReceipts: int
    pending: int
    completedToday: int
    lateArrivals: int
    skuReceipts: int
    flatReceipts: int
    binsAllocated: int

# Auto-create payload
class AutoCreatePayload(BaseModel):
    vendor_id: uuid.UUID
    warehouse_id: uuid.UUID

class AutoCreateBatchPayload(BaseModel):
    warehouse_id: uuid.UUID
