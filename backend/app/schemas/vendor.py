# filepath: c:\Users\priya\Projects\eDrop-UrbanHive\edrop-wms\backend\app\schemas\vendor.py
import uuid
from pydantic import BaseModel
from decimal import Decimal
from datetime import datetime
from typing import Any, List
from enum import Enum

class VendorStatus(str, Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    KYC_PENDING = "KYC PENDING"

class VendorType(str, Enum):
    SKU = "SKU"
    FLAT = "FLAT"

class VendorBase(BaseModel):
    business_name: str
    registered_name: str | None = None
    email: str | None = None
    phone_number: str | None = None
    registered_address: str | None = None
    vendor_type: VendorType
    vendor_status: VendorStatus
    password: str
    created_at: datetime
    updated_at: datetime
    stores: List[Any] = []  # Define a proper store schema if needed

class VendorCreate(VendorBase):
    pass

class VendorUpdate(BaseModel):
    business_name: str | None = None
    registered_name: str | None = None
    email: str | None = None
    phone_number: str | None = None
    registered_address: str | None = None
    vendor_type: VendorType | None = None
    vendor_status: VendorStatus | None = None
    password: str | None = None

class Vendor(VendorBase):
    id: uuid.UUID

    class Config:
        orm_mode = True