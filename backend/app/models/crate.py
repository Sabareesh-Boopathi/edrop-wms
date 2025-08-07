from enum import Enum
import uuid

from sqlalchemy import Column, String, Enum as SAEnum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base_class import Base


class CrateStatus(str, Enum):
    ACTIVE = "active"
    IN_USE = "in_use"
    RESERVED = "reserved"
    DAMAGED = "damaged"
    INACTIVE = "inactive"


class CrateType(str, Enum):
    STANDARD = "standard"
    REFRIGERATED = "refrigerated"
    LARGE = "large"


class Crate(Base):
    __tablename__ = "crates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, index=True, nullable=False)
    qr_code = Column(String, unique=True, index=True, nullable=False)
    status = Column(SAEnum(CrateStatus), default=CrateStatus.ACTIVE, nullable=False)
    type = Column(SAEnum(CrateType), default=CrateType.STANDARD, nullable=False)
    warehouse_id = Column(UUID(as_uuid=True), ForeignKey("warehouses.id"), nullable=True)

    # Example relationship (if applicable, adjust as needed)
    # owner_id = Column(UUID(as_uuid=True), ForeignKey("owners.id"), nullable=True)
    # owner = relationship("Owner")
    warehouse = relationship("Warehouse", back_populates="crates")
