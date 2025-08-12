from typing import Optional
from uuid import UUID
from pydantic import BaseModel
from app.models.crate import CrateStatus, CrateType


# Shared properties
class CrateBase(BaseModel):
    name: Optional[str] = None
    type: Optional[CrateType] = CrateType.STANDARD
    warehouse_id: Optional[UUID] = None


# Properties to receive from client on creation (no name required)
class CrateCreateRequest(BaseModel):
    warehouse_id: UUID
    type: Optional[CrateType] = CrateType.STANDARD
    # Accept as string to allow legacy values like 'unavailable'; API maps to enum
    status: Optional[str] = None


# Internal properties to create DB record (server-generated name)
class CrateCreate(CrateBase):
    name: str
    warehouse_id: UUID
    # Allow API layer to set an initial status (falls back to model default if None)
    status: Optional[CrateStatus] = None


# Properties to receive on item update
class CrateUpdate(CrateBase):
    status: Optional[CrateStatus] = None
    warehouse_id: Optional[UUID] = None


# Properties shared by models stored in DB
class CrateInDBBase(CrateBase):
    id: UUID
    name: str
    qr_code: str
    status: CrateStatus
    type: CrateType

    class Config:
        orm_mode = True
        from_attributes = True


# Properties to return to client
class Crate(CrateInDBBase):
    pass


# Properties properties stored in DB
class CrateInDB(CrateInDBBase):
    pass
