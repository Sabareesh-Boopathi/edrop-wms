# filepath: app/models/store_product.py
import uuid
from sqlalchemy import Column, ForeignKey, Integer, Numeric, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base_class import Base

class StoreProduct(Base):
    __tablename__ = 'store_products'

    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    store_id = Column(UUID(as_uuid=True), ForeignKey('stores.id'), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey('products.id'), nullable=False)
    available_qty = Column(Integer, nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    bin_code = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    store = relationship("Store", back_populates="store_products")
    product = relationship("Product")
