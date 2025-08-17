import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Enum, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.db.base_class import Base


class ReceiptStatusEnum(str):
    AWAITING_UNLOADING = "AWAITING_UNLOADING"
    UNLOADING = "UNLOADING"
    MOVED_TO_BAY = "MOVED_TO_BAY"
    ALLOCATED = "ALLOCATED"
    READY_FOR_PICKING = "READY_FOR_PICKING"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class VendorTypeEnum(str):
    SKU = "SKU"
    FLAT = "FLAT"


class InboundReceipt(Base):
    __tablename__ = "inbound_receipts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(64), unique=True, index=True, nullable=False, default=lambda: f"RCPT-{uuid.uuid4().hex[:8].upper()}")

    warehouse_id = Column(UUID(as_uuid=True), ForeignKey("warehouses.id", ondelete="RESTRICT"), index=True, nullable=False)

    vendor_id = Column(UUID(as_uuid=True), ForeignKey("vendors.id", ondelete="RESTRICT"), index=True, nullable=False)
    vendor_type = Column(Enum(VendorTypeEnum.SKU, VendorTypeEnum.FLAT, name="vendor_type_enum"), nullable=False, default=VendorTypeEnum.SKU)

    reference = Column(String(128), nullable=True)
    planned_arrival = Column(DateTime, nullable=True)
    actual_arrival = Column(DateTime, nullable=True)

    status = Column(
        Enum(
            ReceiptStatusEnum.AWAITING_UNLOADING,
            ReceiptStatusEnum.UNLOADING,
            ReceiptStatusEnum.MOVED_TO_BAY,
            ReceiptStatusEnum.ALLOCATED,
            ReceiptStatusEnum.READY_FOR_PICKING,
            ReceiptStatusEnum.COMPLETED,
            ReceiptStatusEnum.CANCELLED,
            name="inbound_receipt_status_enum",
        ),
        nullable=False,
        default=ReceiptStatusEnum.AWAITING_UNLOADING,
        index=True,
    )

    overs_policy = Column(JSONB, nullable=True)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    lines = relationship("InboundReceiptLine", back_populates="receipt", cascade="all, delete-orphan")
