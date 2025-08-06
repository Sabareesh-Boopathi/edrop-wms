from sqlalchemy.orm import Session
from app.models.store_products import StoreProduct
from app.schemas.store_products import StoreProductCreate, StoreProductUpdate
from app.crud.base import CRUDBase

class CRUDStoreProduct(CRUDBase[StoreProduct, StoreProductCreate, StoreProductUpdate]):
    def get_by_store_and_product(self, db: Session, *, store_id: str, product_id: str) -> StoreProduct:
        return db.query(self.model).filter(
            self.model.store_id == store_id,
            self.model.product_id == product_id
        ).first()

    def get_all_by_store(self, db: Session, *, store_id: str) -> list[StoreProduct]:
        return db.query(self.model).filter(self.model.store_id == store_id).all()

    def get_all_by_product(self, db: Session, *, product_id: str) -> list[StoreProduct]:
        return db.query(self.model).filter(self.model.product_id == product_id).all()

store_product = CRUDStoreProduct(StoreProduct)
