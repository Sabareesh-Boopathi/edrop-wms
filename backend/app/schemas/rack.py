# filepath: backend/app/schemas/rack.py
from typing import Optional
from pydantic import BaseModel
from uuid import UUID

class RackBase(BaseModel):
    name: Optional[str] = None
    warehouse_id: UUID
    stacks: int
    bins_per_stack: int
    description: Optional[str] = None
    status: Optional[str] = 'active'

# Client request for creating a rack (no name provided)
class RackCreateRequest(BaseModel):
    warehouse_id: UUID
    stacks: int
    bins_per_stack: int
    description: Optional[str] = None
    status: Optional[str] = 'active'

# Internal create with server-generated name
class RackCreate(RackBase):
    name: str

class RackUpdate(BaseModel):
    name: Optional[str] = None
    warehouse_id: Optional[UUID] = None
    stacks: Optional[int] = None
    bins_per_stack: Optional[int] = None
    description: Optional[str] = None
    status: Optional[str] = None

class Rack(RackBase):
    id: UUID

    class Config:
        orm_mode = True
        from_attributes = True

# Outgoing schema with computed stats
class RackOut(Rack):
    total_bins: int
    occupied_bins: int
