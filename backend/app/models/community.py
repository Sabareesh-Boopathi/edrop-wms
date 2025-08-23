# filepath: backend/app/models/community.py
import uuid
from sqlalchemy import Column, String, Text, Numeric, Enum, ForeignKey, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base

class Community(Base):
    __tablename__ = "communities"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Basic details - Only for apartment complexes/societies
    name = Column(String(255), nullable=False, index=True, unique=True)  # Community/Society name
    address_line1 = Column(String(500), nullable=False)
    address_line2 = Column(String(500), nullable=True)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    pincode = Column(String(20), nullable=False)
    landmark = Column(String(255), nullable=True)
    latitude = Column(Numeric(precision=15, scale=10), nullable=True)
    longitude = Column(Numeric(precision=15, scale=10), nullable=True)
    
    # Community management details
    rwa_name = Column(String(255), nullable=True)  # RWA/Society name
    rwa_email = Column(String(255), nullable=True)  # RWA email
    fm_email = Column(String(255), nullable=True)   # Facility Manager email
    fm_number = Column(String(20), nullable=True)   # Facility Manager phone number
    blocks = Column(ARRAY(String), nullable=True)   # Blocks/Towers in the community
    
    # Metadata
    code = Column(String(50), nullable=True, index=True)  # Community code
    status = Column(Enum("ACTIVE", "INACTIVE", name="community_status_enum"), nullable=False, default="ACTIVE")
    is_active = Column(Boolean, nullable=False, default=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    warehouse_id = Column(UUID(as_uuid=True), ForeignKey("warehouses.id"), nullable=True)
    warehouse = relationship("Warehouse", lazy='joined')
    customers = relationship("Customer", back_populates="community")
