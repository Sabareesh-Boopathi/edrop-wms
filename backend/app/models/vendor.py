# filepath: backend/app/models/vendor.py
import uuid
from sqlalchemy import Column, String, Text, Numeric, ForeignKey, UniqueConstraint, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base_class import Base
from datetime import datetime
from enum import Enum
import sqlalchemy

class VendorStatus(str, Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    KYC_PENDING = "KYC PENDING"

class VendorType(str, Enum):
    SKU = "SKU"
    FLAT = "FLAT"

class Vendor(Base):  # <-- Renamed class
    __tablename__ = "vendors"  # <-- Renamed table
    __table_args__ = (
        UniqueConstraint('business_name', name='uq_vendor_name'),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_name = Column(String(255), nullable=False, index=True)
    registered_name = Column(String, nullable=True)
    email = Column(String, unique=True, index=True, nullable=True)
    phone_number = Column(String, nullable=True)
    registered_address = Column(String, nullable=True)
    vendor_type = Column(sqlalchemy.Enum(VendorType), nullable=False)
    vendor_status = Column(sqlalchemy.Enum(VendorStatus), nullable=False)
    password = Column(String, nullable=False)  # Added password field
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    address = Column(Text)
    
    # Retain the relationship with Store, remove the relationship with Product
    stores = relationship('Store', back_populates='vendor')