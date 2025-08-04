# filepath: backend/app/models/warehouse.py
import uuid
from sqlalchemy import Column, String, Text, ForeignKey, Numeric, Date, Integer, Enum, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Warehouse(Base):
    __tablename__ = "warehouses"
    __table_args__ = (
        UniqueConstraint('name', 'address', name='uq_warehouse_name_address'),
    )
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, index=True)
    address = Column(Text)
    city = Column(String(100), nullable=False)
    latitude = Column(Numeric(10, 7))
    longitude = Column(Numeric(10, 7))
    manager_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    status = Column(Enum("ACTIVE", "INACTIVE", "NEAR_CAPACITY", name="warehouse_status_enum"), nullable=False)
    size_sqft = Column(Integer, nullable=False)
    utilization_pct = Column(Numeric(5, 2), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date)
    capacity_units = Column(Integer)
    operations_time = Column(String(100))
    contact_phone = Column(String(20))
    contact_email = Column(String(255))
    manager = relationship("User")