# filepath: backend/app/models/order.py
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Numeric, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Order(Base):
    __tablename__ = "orders"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    status = Column(String(50), nullable=False, default="pending")
    total_amount = Column(Numeric(10, 2), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id"), nullable=False)
    warehouse_id = Column(UUID(as_uuid=True), ForeignKey("warehouses.id"), nullable=False)
    customer = relationship("Customer")
    warehouse = relationship("Warehouse")
    # This relationship will link to the association table
    items = relationship("OrderProduct", back_populates="order")