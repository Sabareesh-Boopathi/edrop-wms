# filepath: backend/app/models/address.py
import uuid
from sqlalchemy import Column, String, Text, Numeric, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base

class Address(Base):
    __tablename__ = "addresses"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Address details for individual houses
    street_address = Column(String(500), nullable=False)  # House number + street
    area = Column(String(255), nullable=True)  # Area/Locality
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    pincode = Column(String(20), nullable=False)
    country = Column(String(100), default="India", nullable=False)
    
    # Additional details for deliveries
    landmark = Column(String(255), nullable=True)  # Nearby landmark
    door_number = Column(String(50), nullable=True)  # Door/gate number if different from street address
    delivery_instructions = Column(Text, nullable=True)  # Special delivery instructions
    
    # Geolocation for precise mapping
    latitude = Column(Numeric(precision=10, scale=8), nullable=True)  # Precise latitude
    longitude = Column(Numeric(precision=11, scale=8), nullable=True)  # Precise longitude
    
    # Metadata
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    customers = relationship("Customer", back_populates="address")
