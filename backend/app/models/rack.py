# filepath: backend/app/models/rack.py
import uuid
from sqlalchemy import Column, String, Integer, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Rack(Base):
    __tablename__ = 'racks'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, index=True)
    warehouse_id = Column(UUID(as_uuid=True), ForeignKey('warehouses.id', ondelete='CASCADE'), nullable=False, index=True)
    stacks = Column(Integer, nullable=False, default=1)
    bins_per_stack = Column(Integer, nullable=False, default=1)
    description = Column(Text)
    # New: status of the rack (active, maintenance, inactive)
    status = Column(String(50), nullable=False, default='active')

    bins = relationship('Bin', back_populates='rack', cascade='all, delete-orphan')
