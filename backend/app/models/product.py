# filepath: backend/app/models/product.py
import uuid
from sqlalchemy import Column, String, Text, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Product(Base):
    __tablename__ = "products"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text)
    sku = Column(String(100), nullable=False, unique=True)
    price = Column(Numeric(10, 2), nullable=False)
    vendor_id = Column(UUID(as_uuid=True), ForeignKey("vendors.id"), nullable=False)

    order_products = relationship("OrderProduct", back_populates="product")
    store_products = relationship('StoreProduct', back_populates='product')