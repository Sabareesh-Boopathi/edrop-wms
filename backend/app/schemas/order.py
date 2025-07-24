# filepath: c:\Users\priya\Projects\eDrop-UrbanHive\edrop-wms\backend\app\schemas\order.py
import uuid
from pydantic import BaseModel
from decimal import Decimal
from typing import List

# --- Order Item Schemas ---
class OrderItemBase(BaseModel):
    product_id: uuid.UUID
    quantity: int
    price: Decimal

class OrderItemCreate(OrderItemBase):
    pass

class OrderItem(OrderItemBase):
    class Config:
        from_attributes = True

# --- Order Schemas ---
class OrderBase(BaseModel):
    customer_id: uuid.UUID
    warehouse_id: uuid.UUID
    status: str = "pending"

class OrderCreate(OrderBase):
    items: List[OrderItemCreate]

class OrderUpdate(BaseModel):
    status: str | None = None

class Order(OrderBase):
    id: uuid.UUID
    total_amount: Decimal
    items: List[OrderItem] = []

    class Config:
        from_attributes = True