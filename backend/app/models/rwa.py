# filepath: backend/app/models/rwa.py
import uuid
from sqlalchemy import Column, String, Text, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class RWA(Base):
    __tablename__ = "rwas"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, index=True, unique=True)
    address = Column(Text)
    city = Column(String(100))
    
    # --- THIS IS THE FIX ---
    # Add the missing columns to match the schema
    latitude = Column(Numeric(10, 7), nullable=True)
    longitude = Column(Numeric(10, 7), nullable=True)
    # --- END OF FIX ---

    flats = relationship("Flat", back_populates="rwa")