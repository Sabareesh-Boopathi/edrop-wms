# filepath: backend/app/models/customer.py
import uuid
from sqlalchemy import Column, String, ForeignKey, UniqueConstraint, DateTime, Text, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base
import enum

class CustomerStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    SUSPENDED = "SUSPENDED"

class Customer(Base):
    __tablename__ = "customers"
    __table_args__ = (
        UniqueConstraint('email', name='uq_customer_email'),
        UniqueConstraint('phone_number', name='uq_customer_phone_number'),
        # Ensure unique location for community customers
        UniqueConstraint('community_id', 'block', 'flat_number', name='uq_customer_community_location'),
    )
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Basic customer info
    name = Column(String(255), nullable=False)
    phone_number = Column(String(50), unique=True, index=True)
    email = Column(String(255), nullable=False, unique=True)
    
    # Location - Either community OR address (not both)
    # For apartment customers - use community
    community_id = Column(UUID(as_uuid=True), ForeignKey("communities.id"), nullable=True)
    block = Column(String(100), nullable=True)  # Block/Tower within the community
    flat_number = Column(String(50), nullable=True)  # Flat number within the block
    
    # For individual house customers - use address
    address_id = Column(UUID(as_uuid=True), ForeignKey("addresses.id"), nullable=True)
    
    # Customer status and metadata
    status = Column(Enum(CustomerStatus), default=CustomerStatus.ACTIVE, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    community = relationship("Community", back_populates="customers")
    address = relationship("Address", back_populates="customers")
    
    @property
    def location_type(self):
        """Return the type of customer location"""
        if self.community_id:
            return "COMMUNITY"
        elif self.address_id:
            return "INDIVIDUAL"
        return None
    
    @property
    def full_address(self):
        """Return formatted full address"""
        if self.community:
            addr = f"{self.community.name}"
            if self.block:
                addr += f", Block {self.block}"
            if self.flat_number:
                addr += f", Flat {self.flat_number}"
            addr += f", {self.community.city}"
            return addr
        elif self.address:
            addr = f"{self.address.street_address}"
            if self.address.area:
                addr += f", {self.address.area}"
            addr += f", {self.address.city}"
            return addr
        return "No address"