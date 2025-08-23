import uuid
from pydantic import BaseModel
from typing import Optional

class DriverBase(BaseModel):
    name: str
    phone: str
    license_no: str
    license_expiry: Optional[str] | None = None
    status: str
    carrier: Optional[str] | None = None
    assigned_vehicle_id: Optional[uuid.UUID] | None = None
    warehouse_id: Optional[uuid.UUID] | None = None

class DriverCreate(DriverBase):
    pass

class DriverUpdate(BaseModel):
    name: Optional[str] | None = None
    phone: Optional[str] | None = None
    license_no: Optional[str] | None = None
    license_expiry: Optional[str] | None = None
    status: Optional[str] | None = None
    carrier: Optional[str] | None = None
    assigned_vehicle_id: Optional[uuid.UUID] | None = None

class Driver(BaseModel):
    id: uuid.UUID
    name: str
    phone: str
    license_no: str
    license_expiry: Optional[str] | None = None
    status: str
    carrier: Optional[str] | None = None
    assigned_vehicle_id: Optional[uuid.UUID] | None = None
    created_at: Optional[str] | None = None
    updated_at: Optional[str] | None = None

    class Config:
        from_attributes = True
