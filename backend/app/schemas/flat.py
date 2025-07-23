import uuid
from pydantic import BaseModel

class FlatBase(BaseModel):
    name: str | None = None
    tower_block: str | None = None
    flat_number: str
    rwa_id: uuid.UUID

class FlatCreate(FlatBase):
    pass

class FlatUpdate(BaseModel):
    name: str | None = None
    tower_block: str | None = None
    flat_number: str | None = None
    rwa_id: uuid.UUID | None = None

class Flat(FlatBase):
    id: uuid.UUID
    class Config:
        from_attributes = True