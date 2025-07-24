# filepath: c:\Users\priya\Projects\eDrop-UrbanHive\edrop-wms\backend\app\schemas\order_products.py
from pydantic import BaseModel
from uuid import UUID
from decimal import Decimal

# Base schema with common fields
class OrderProductBase(BaseModel):
    order_id: UUID
    product_id: UUID
    quantity: int
    price_at_time_of_order: Decimal

# Schema for creating a new order-product link
class OrderProductCreate(OrderProductBase):
    pass

# Schema for updating an order-product link (optional fields)
class OrderProductUpdate(BaseModel):
    quantity: int | None = None
    price_at_time_of_order: Decimal | None = None

# Schema for reading an order-product link from the DB
class OrderProduct(OrderProductBase):
    id: UUID

    class Config:
        from_attributes = True