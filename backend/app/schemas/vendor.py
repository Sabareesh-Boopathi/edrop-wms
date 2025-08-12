# filepath: c:\Users\priya\Projects\eDrop-UrbanHive\edrop-wms\backend\app\schemas\vendor.py
import uuid
from pydantic import BaseModel
from datetime import datetime
from typing import List
from enum import Enum
from app.schemas.store import Store  # Use concrete Store schema for serialization

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
    # NOTE: Do NOT include password or timestamps in base (common) schema used for input/output

class VendorCreate(VendorBase):
    # Only required on creation
    password: str

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
    created_at: datetime
    updated_at: datetime
    # Use proper schema to ensure serializable output
    stores: List[Store] = []

    class Config:
        # Pydantic v2 compatibility for ORM models
        from_attributes = True

class VendorSummary(BaseModel):
    id: uuid.UUID
    business_name: str
    email: str | None = None
    phone_number: str | None = None
    vendor_type: VendorType
    vendor_status: VendorStatus
    store_count: int
    product_count: int