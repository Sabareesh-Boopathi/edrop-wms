import uuid
from datetime import datetime
from pydantic import BaseModel
from typing import Optional

# Import the enum from models
from app.models.customer import CustomerStatus

class CustomerBase(BaseModel):
    name: str  # Customer name
    phone_number: Optional[str] = None
    email: str
    
    # Location - Either community OR address (not both)
    # For apartment customers
    community_id: Optional[uuid.UUID] = None
    block: Optional[str] = None  # Block/Tower within the community
    flat_number: Optional[str] = None  # Flat number within the block
    
    # For individual house customers
    address_id: Optional[uuid.UUID] = None
    
    # Status and metadata
    status: CustomerStatus = CustomerStatus.ACTIVE
    notes: Optional[str] = None  # Additional notes about the customer

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[str] = None
    community_id: Optional[uuid.UUID] = None
    block: Optional[str] = None
    flat_number: Optional[str] = None
    address_id: Optional[uuid.UUID] = None
    status: Optional[CustomerStatus] = None
    notes: Optional[str] = None

class Customer(CustomerBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    
    # Computed properties
    location_type: Optional[str] = None  # COMMUNITY or INDIVIDUAL
    full_address: Optional[str] = None   # Computed full address
    
    class Config:
        from_attributes = True