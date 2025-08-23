import uuid
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel
from typing import Optional

class AddressBase(BaseModel):
    street_address: str
    area: Optional[str] = None
    city: str
    state: str
    pincode: str
    country: str = "India"
    landmark: Optional[str] = None
    door_number: Optional[str] = None
    delivery_instructions: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    notes: Optional[str] = None

class AddressCreate(AddressBase):
    pass

class AddressUpdate(BaseModel):
    street_address: Optional[str] = None
    area: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    country: Optional[str] = None
    landmark: Optional[str] = None
    door_number: Optional[str] = None
    delivery_instructions: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    notes: Optional[str] = None

class Address(AddressBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
