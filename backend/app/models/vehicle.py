import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import sqlalchemy as sa

from app.db.base_class import Base


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    reg_no = Column(String(50), nullable=False, unique=True, index=True)
    type = Column(sa.Enum('VAN_S', 'TRUCK_M', 'TRUCK_L', name='vehicletype'), nullable=False)
    capacity_totes = Column(Integer, nullable=True)
    capacity_volume = Column(Integer, nullable=True)
    status = Column(sa.Enum('AVAILABLE', 'IN_SERVICE', 'MAINTENANCE', name='vehiclestatus'), nullable=False, default='AVAILABLE')
    carrier = Column(String(255), nullable=True)
    warehouse_id = Column(UUID(as_uuid=True), ForeignKey("warehouses.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    drivers = relationship("Driver", back_populates="vehicle")
