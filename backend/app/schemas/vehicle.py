import uuid
from pydantic import BaseModel
from typing import Optional

class VehicleBase(BaseModel):
    reg_no: str
    type: str
    capacity_totes: Optional[int] | None = None
    capacity_volume: Optional[int] | None = None
    status: str
    carrier: Optional[str] | None = None
    warehouse_id: Optional[uuid.UUID] | None = None

class VehicleCreate(VehicleBase):
    pass

class VehicleUpdate(BaseModel):
    reg_no: Optional[str] | None = None
    type: Optional[str] | None = None
    capacity_totes: Optional[int] | None = None
    capacity_volume: Optional[int] | None = None
    status: Optional[str] | None = None
    carrier: Optional[str] | None = None

class Vehicle(BaseModel):
    id: uuid.UUID
    reg_no: str
    type: str
    capacity_totes: Optional[int] | None = None
    capacity_volume: Optional[int] | None = None
    status: str
    carrier: Optional[str] | None = None
    created_at: Optional[str] | None = None
    updated_at: Optional[str] | None = None

    class Config:
        from_attributes = True
