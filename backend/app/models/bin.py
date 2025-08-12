# filepath: backend/app/models/bin.py
import uuid
from sqlalchemy import Column, String, Integer, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Bin(Base):
    __tablename__ = 'bins'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rack_id = Column(UUID(as_uuid=True), ForeignKey('racks.id', ondelete='CASCADE'), nullable=False, index=True)
    stack_index = Column(Integer, nullable=False)  # row
    bin_index = Column(Integer, nullable=False)    # column
    code = Column(String(100))
    status = Column(Enum('empty', 'occupied', 'reserved', 'blocked', 'maintenance', name='bin_status_enum'), nullable=False, default='empty')
    crate_id = Column(UUID(as_uuid=True), ForeignKey('crates.id'), nullable=True)
    product_id = Column(UUID(as_uuid=True), ForeignKey('products.id'), nullable=True)
    store_product_id = Column(UUID(as_uuid=True), ForeignKey('store_products.id'), nullable=True)
    quantity = Column(Integer)

    rack = relationship('Rack', back_populates='bins')
