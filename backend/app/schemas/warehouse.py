import uuid
from pydantic import BaseModel
from decimal import Decimal
from enum import Enum
from datetime import date
from typing import Optional

class WarehouseStatus(str, Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    NEAR_CAPACITY = "NEAR_CAPACITY"

class WarehouseBase(BaseModel):
    name: str
    address: str | None = None
    city: str
    latitude: Decimal | None = None
    longitude: Decimal | None = None
    manager_id: uuid.UUID | None = None
    status: WarehouseStatus
    size_sqft: int
    utilization_pct: Decimal
    start_date: date
    end_date: Optional[date] = None
    capacity_units: Optional[int] = None
    operations_time: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None

class WarehouseCreate(WarehouseBase):
    utilization_pct: Optional[Decimal] = Decimal("0.00")

class WarehouseUpdate(BaseModel):
    name: str | None = None
    address: str | None = None
    city: str | None = None
    latitude: Decimal | None = None
    longitude: Decimal | None = None
    manager_id: uuid.UUID | None = None
    status: Optional[WarehouseStatus] = None
    size_sqft: Optional[int] = None
    utilization_pct: Optional[Decimal] = Decimal("0.00")
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    capacity_units: Optional[int] = None
    operations_time: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None

class Warehouse(WarehouseBase):
    id: uuid.UUID
    class Config:
        from_attributes = True