# filepath: c:\Users\priya\Projects\eDrop-UrbanHive\edrop-wms\backend\app\crud\crud_order_products.py
from uuid import UUID
from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.order_product import OrderProduct
from app.schemas.order_products import OrderProductCreate, OrderProductUpdate

class CRUDOrderProduct(CRUDBase[OrderProduct, OrderProductCreate, OrderProductUpdate]):
    def get_by_order_id(self, db: Session, *, order_id: UUID) -> list[OrderProduct]:
        return db.query(self.model).filter(self.model.order_id == order_id).all()

order_product = CRUDOrderProduct(OrderProduct)