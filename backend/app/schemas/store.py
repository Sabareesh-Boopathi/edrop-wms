import uuid
from pydantic import BaseModel
from decimal import Decimal
from datetime import datetime
from typing import List, Optional
from sqlalchemy import Column, String, ForeignKey, DateTime, Table
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from app.db.base_class import Base

# SQLAlchemy Model
class Store(Base):
    __tablename__ = 'stores'

    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    store_name = Column(String, nullable=False)
    address = Column(String, nullable=True)
    latitude = Column(String, nullable=True)
    longitude = Column(String, nullable=True)
    store_ratings = Column(String, nullable=True)
    store_reviews_count = Column(String, nullable=True)
    store_status = Column(String, nullable=False)  # ACTIVE, INACTIVE
    operation_start_time = Column(String, nullable=True)
    operation_end_time = Column(String, nullable=True)
    product_ids = Column(ARRAY(UUID(as_uuid=True)), nullable=True)  # List of products (if vendor_type is SKU)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    vendor_id = Column(UUID(as_uuid=True), ForeignKey('vendors.id'))
    vendor = relationship('Vendor', back_populates='stores')

    warehouses = relationship(
        'Warehouse',
        secondary='store_warehouse_association',
        back_populates='stores'
    )

# Base Pydantic Schema
class StoreBase(BaseModel):
    store_name: str
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    store_ratings: Optional[float] = None
    store_reviews_count: Optional[int] = None
    store_status: str  # ACTIVE, INACTIVE
    operation_start_time: Optional[str] = None  # e.g., 09:00 AM
    operation_end_time: Optional[str] = None  # e.g., 09:00 PM
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

# Schema for creating a store
class StoreCreate(StoreBase):
    pass

# Schema for updating a store
class StoreUpdate(StoreBase):
    store_name: str | None = None

# Schema for reading a store
class Store(StoreBase):
    id: UUID
    store_products: List['StoreProduct'] = []  # Updated to reflect the relationship with StoreProduct

    class Config:
        orm_mode = True
