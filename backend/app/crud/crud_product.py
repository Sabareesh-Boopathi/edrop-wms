from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate
from .base import CRUDBase
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

class CRUDProduct(CRUDBase[Product, ProductCreate, ProductUpdate]):
    def create(self, db: Session, *, obj_in: ProductCreate) -> Product:
        try:
            db_obj = self.model(**obj_in.dict())
            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)
            return db_obj
        except SQLAlchemyError as e:
            db.rollback()
            raise e

product = CRUDProduct(Product)