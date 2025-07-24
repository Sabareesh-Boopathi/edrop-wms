# filepath: backend/app/models/user.py
import uuid
from sqlalchemy import Column, String, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)
    is_active = Column(Boolean(), default=True)

    # Relationships
    customer = relationship("Customer", back_populates="user", uselist=False)
    vendor = relationship("Vendor", back_populates="user", uselist=False) # Renamed from vendor_profile
    warehouse_manager_for = relationship("Warehouse", back_populates="manager")