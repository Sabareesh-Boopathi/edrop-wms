# filepath: backend/app/models/flat.py
import uuid
from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Flat(Base):
    __tablename__ = "flats"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), index=True)
    tower_block = Column(String(50))
    flat_number = Column(String(50), nullable=False)
    rwa_id = Column(UUID(as_uuid=True), ForeignKey("rwas.id"), nullable=False)
    rwa = relationship("RWA")