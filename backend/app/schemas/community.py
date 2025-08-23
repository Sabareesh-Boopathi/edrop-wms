# filepath: backend/app/schemas/community.py
import uuid
from typing import Optional, List
from pydantic import BaseModel
from decimal import Decimal
from datetime import datetime

# --- Base Schema ---
# Contains shared properties for apartment communities/societies only
class CommunityBase(BaseModel):
    name: str                                    # Community/Society name
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    state: str
    pincode: str
    landmark: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    
    # Community management details
    rwa_name: Optional[str] = None                  # RWA/Society name
    rwa_email: Optional[str] = None                 # RWA email
    fm_email: Optional[str] = None                  # Facility Manager email
    fm_number: Optional[str] = None                 # Facility Manager phone number
    blocks: Optional[List[str]] = None              # Blocks/Towers in the community
    
    # Metadata
    code: Optional[str] = None                      # Community code
    status: str = "ACTIVE"                       # ACTIVE, INACTIVE
    is_active: bool = True
    notes: Optional[str] = None
    warehouse_id: Optional[uuid.UUID] = None

# --- Create Schema ---
class CommunityCreate(CommunityBase):
    pass

# --- Update Schema ---
class CommunityUpdate(BaseModel):
    name: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    landmark: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    rwa_name: Optional[str] = None
    rwa_email: Optional[str] = None
    fm_email: Optional[str] = None
    fm_number: Optional[str] = None
    blocks: Optional[List[str]] = None
    code: Optional[str] = None
    status: Optional[str] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None
    warehouse_id: Optional[str] = None

# --- Read Schema ---
class Community(CommunityBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
