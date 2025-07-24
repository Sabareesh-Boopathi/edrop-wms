# filepath: c:\Users\priya\Projects\eDrop-UrbanHive\edrop-wms\backend\app\schemas\vendor.py
import uuid
from pydantic import BaseModel
from decimal import Decimal

class VendorBase(BaseModel):
    business_name: str
    address: str | None = None
    latitude: Decimal | None = None
    longitude: Decimal | None = None

class VendorCreate(VendorBase):
    user_id: uuid.UUID

class VendorUpdate(BaseModel):
    business_name: str | None = None
    address: str | None = None
    latitude: Decimal | None = None
    longitude: Decimal | None = None

class Vendor(VendorBase):
    id: uuid.UUID
    user_id: uuid.UUID

    class Config:
        from_attributes = True