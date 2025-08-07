from typing import Optional
from uuid import UUID
from pydantic import BaseModel
from app.models.crate import CrateStatus, CrateType


# Shared properties
class CrateBase(BaseModel):
    name: Optional[str] = None
    type: Optional[CrateType] = CrateType.STANDARD
    warehouse_id: Optional[UUID] = None


# Properties to receive on item creation
class CrateCreate(CrateBase):
    name: str
    warehouse_id: UUID


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


# Properties to return to client
class Crate(CrateInDBBase):
    pass


# Properties properties stored in DB
class CrateInDB(CrateInDBBase):
    pass
