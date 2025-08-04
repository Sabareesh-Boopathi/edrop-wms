import uuid
from sqlalchemy import Column, String, DateTime, func, UUID, TEXT, ForeignKey, Enum, Integer
from sqlalchemy.orm import relationship
from app.db.base_class import Base
from enum import Enum as PyEnum

class MilestoneEventType(str, PyEnum):
    CUSTOMER_COUNT = "customer_count"
    ORDER_COUNT = "order_count"
    VENDOR_COUNT = "vendor_count"
    WAREHOUSE_CREATED = "warehouse_created"
    CUSTOMER_ORDER_COUNT = "customer_order_count"
    WAREHOUSE_ANNIVERSARY = "warehouse_anniversary"

class MilestoneEntityType(str, PyEnum):
    CUSTOMER = "customer"
    ORDER = "order"
    VENDOR = "vendor"
    WAREHOUSE = "warehouse"
    SYSTEM = "system"

class Milestone(Base):
    __tablename__ = 'milestones'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    description = Column(TEXT, nullable=True)
    milestone_type = Column(String(50), nullable=False, index=True)
    timestamp = Column(DateTime, server_default=func.now())
    related_entity_id = Column(String(255), nullable=True)
    related_entity_type = Column(String(50), nullable=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    user = relationship("User", back_populates="milestones")
    event_type = Column(Enum(MilestoneEventType), nullable=False)
    entity_type = Column(Enum(MilestoneEntityType), nullable=True)
    milestone_value = Column(Integer, nullable=False)
