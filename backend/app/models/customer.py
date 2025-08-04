# filepath: backend/app/models/customer.py
import uuid
from sqlalchemy import Column, String, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Customer(Base):
    __tablename__ = "customers"
    __table_args__ = (
        UniqueConstraint('email', name='uq_customer_email'),
        UniqueConstraint('phone_number', name='uq_customer_phone_number'),
        UniqueConstraint('email', 'phone_number', name='uq_customer_email_phone_number'),
    )
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    phone_number = Column(String(50), unique=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    flat_id = Column(UUID(as_uuid=True), ForeignKey("flats.id"), nullable=False)
    email = Column(String(255), nullable=False, unique=True)
    user = relationship("User")
    flat = relationship("Flat")