from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate
from .base import CRUDBase

class CRUDProduct(CRUDBase[Product, ProductCreate, ProductUpdate]):
    pass

product = CRUDProduct(Product)