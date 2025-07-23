# filepath: backend/app/schemas/rwa.py
import uuid
from pydantic import BaseModel
from decimal import Decimal

# --- Base Schema ---
# Contains shared properties.
class RWABase(BaseModel):
    name: str
    address: str | None = None
    city: str
    latitude: Decimal | None = None
    longitude: Decimal | None = None

# --- Create Schema ---
# Properties required when creating via the API.
class RWACreate(RWABase):
    pass # All fields from RWABase are required

# --- Update Schema ---
# Properties that can be updated. All are optional.
class RWAUpdate(BaseModel):
    name: str | None = None
    address: str | None = None
    city: str | None = None
    latitude: Decimal | None = None
    longitude: Decimal | None = None

# --- Read Schema ---
# Properties to be returned by the API. Includes the ID.
class RWA(RWABase):
    id: uuid.UUID

    class Config:
        from_attributes = True