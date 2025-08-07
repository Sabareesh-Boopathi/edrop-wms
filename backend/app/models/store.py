import uuid
from sqlalchemy import Column, String, ForeignKey, DateTime, Table, Numeric, Integer, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from app.db.base_class import Base
from datetime import datetime

store_warehouse_association = Table(
    'store_warehouse_association',
    Base.metadata,
    Column('store_id', UUID(as_uuid=True), ForeignKey('stores.id'), primary_key=True),
    Column('warehouse_id', UUID(as_uuid=True), ForeignKey('warehouses.id'), primary_key=True)
    , extend_existing=True
)

class Store(Base):
    __tablename__ = 'stores'
    __table_args__ = (
        UniqueConstraint('store_name', name='uq_store_name'),
        {'extend_existing': True},
    )

    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    store_name = Column(String(255), nullable=False, index=True)
    address = Column(String(255), nullable=True)
    latitude = Column(Numeric(10, 7), nullable=True)
    longitude = Column(Numeric(10, 7), nullable=True)
    store_ratings = Column(Numeric(3, 2), nullable=True)
    store_reviews_count = Column(Integer, nullable=True)
    store_status = Column(String(50), nullable=False, default='ACTIVE')
    operation_start_time = Column(String(10), nullable=True)  # e.g., 09:00 AM
    operation_end_time = Column(String(10), nullable=True)  # e.g., 09:00 PM
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    product_ids = Column(ARRAY(UUID(as_uuid=True)), nullable=True)

    # Relationships
    vendor_id = Column(UUID(as_uuid=True), ForeignKey('vendors.id'), nullable=False)
    vendor = relationship('Vendor', back_populates='stores')

    warehouses = relationship(
        'Warehouse',
        secondary='store_warehouse_association',
        back_populates='stores'
    )

    store_products = relationship('StoreProduct', back_populates='store')
