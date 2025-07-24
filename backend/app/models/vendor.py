# filepath: backend/app/models/vendor.py
import uuid
from sqlalchemy import Column, String, Text, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Vendor(Base):  # <-- Renamed class
    __tablename__ = "vendors"  # <-- Renamed table
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_name = Column(String(255), nullable=False, index=True)
    address = Column(Text)
    latitude = Column(Numeric(10, 7))
    longitude = Column(Numeric(10, 7))
    
    # This creates a one-to-one relationship with the User model
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True)
    user = relationship("User", back_populates="vendor") # <-- Updated back_populates
    
    # Add the relationship to the products this vendor sells.
    products = relationship("Product", back_populates="vendor")