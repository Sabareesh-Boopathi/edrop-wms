import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import sqlalchemy as sa

from app.db.base_class import Base


class Driver(Base):
    __tablename__ = "drivers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=False, index=True)
    license_no = Column(String(100), nullable=False)
    license_expiry = Column(String(20), nullable=True)
    status = Column(sa.Enum('ACTIVE', 'INACTIVE', name='driverstatus'), nullable=False, default='ACTIVE')
    carrier = Column(String(255), nullable=True)
    assigned_vehicle_id = Column(UUID(as_uuid=True), ForeignKey("vehicles.id"), nullable=True)
    warehouse_id = Column(UUID(as_uuid=True), ForeignKey("warehouses.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    vehicle = relationship("Vehicle", back_populates="drivers", foreign_keys=[assigned_vehicle_id])
