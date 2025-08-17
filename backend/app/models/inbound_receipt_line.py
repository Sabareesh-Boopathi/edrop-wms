import uuid
from sqlalchemy import Column, String, Integer, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base_class import Base


class InboundReceiptLine(Base):
    __tablename__ = "inbound_receipt_lines"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    receipt_id = Column(UUID(as_uuid=True), ForeignKey("inbound_receipts.id", ondelete="CASCADE"), index=True, nullable=False)

    # SKU mode
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=True)
    product_sku = Column(String(64), nullable=True)
    product_name = Column(String(255), nullable=True)

    # FLAT mode
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id"), nullable=True)
    customer_name = Column(String(255), nullable=True)
    apartment = Column(String(64), nullable=True)

    quantity = Column(Integer, nullable=False, default=1)
    received_qty = Column(Integer, nullable=True)

    damaged = Column(Integer, nullable=True)
    missing = Column(Integer, nullable=True)
    ack_diff = Column(Integer, nullable=True)
    damaged_origin = Column(Enum("UNLOADING", "WAREHOUSE", name="damage_origin_enum"), nullable=True)

    bin_id = Column(UUID(as_uuid=True), ForeignKey("bins.id"), nullable=True, index=True)

    notes = Column(String(512), nullable=True)

    receipt = relationship("InboundReceipt", back_populates="lines")
