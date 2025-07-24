# filepath: backend/app/models/order_product.py
from sqlalchemy import Column, ForeignKey, Integer, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class OrderProduct(Base):
    __tablename__ = 'order_products'
    order_id = Column(UUID(as_uuid=True), ForeignKey('orders.id'), primary_key=True)
    product_id = Column(UUID(as_uuid=True), ForeignKey('products.id'), primary_key=True)
    quantity = Column(Integer, nullable=False)
    price = Column(Numeric(10, 2), nullable=False)

    order = relationship("Order", back_populates="items")
    product = relationship("Product")