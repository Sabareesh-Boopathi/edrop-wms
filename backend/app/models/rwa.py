# filepath: backend/app/models/rwa.py
import uuid
from sqlalchemy import Column, String, Text
from sqlalchemy.dialects.postgresql import UUID
from app.db.base_class import Base

class RWA(Base):
    __tablename__ = "rwas"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, index=True)
    address = Column(Text)
    city = Column(String(100), nullable=False)