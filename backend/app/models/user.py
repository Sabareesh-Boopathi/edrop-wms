# filepath: backend/app/models/user.py
import uuid
from sqlalchemy import Column, String, Boolean, DateTime, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base_class import Base
from app.models.milestone import Milestone

class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        UniqueConstraint('email', name='uq_user_email'),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default='viewer')
    status = Column(String(50), nullable=False, default='pending') # Replaces is_active
    phone_number = Column(String(20), nullable=True)
    address = Column(String(255), nullable=True)
    last_login = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    customer = relationship("Customer", back_populates="user", uselist=False)
    vendor = relationship("Vendor", back_populates="user", uselist=False) # Renamed from vendor_profile
    warehouses = relationship("Warehouse", back_populates="manager", cascade="all, delete-orphan")
    milestones = relationship("Milestone", back_populates="user")