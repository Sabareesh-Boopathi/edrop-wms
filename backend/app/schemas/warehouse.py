import uuid
from pydantic import BaseModel
from decimal import Decimal

class WarehouseBase(BaseModel):
    name: str
    address: str | None = None
    city: str
    latitude: Decimal | None = None
    longitude: Decimal | None = None
    manager_id: uuid.UUID | None = None

class WarehouseCreate(WarehouseBase):
    pass

class WarehouseUpdate(BaseModel):
    name: str | None = None
    address: str | None = None
    city: str | None = None
    latitude: Decimal | None = None
    longitude: Decimal | None = None
    manager_id: uuid.UUID | None = None

class Warehouse(WarehouseBase):
    id: uuid.UUID
    class Config:
        from_attributes = True