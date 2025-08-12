# filepath: c:\Users\priya\Projects\eDrop-UrbanHive\edrop-wms\backend\app\crud\__init__.py
# This file makes the CRUD objects available under the `crud` namespace.
# e.g., from app import crud; crud.user.get(...)

from .crud_user import user
from .crud_rwa import rwa
from .crud_flat import flat
from .crud_customer import customer
from .crud_vendor import vendor
from .crud_product import product
from .crud_warehouse import warehouse
from .crud_order import order
from .crud_order_products import order_product
from .crud_milestone import milestone
from .crud_crate import crate
from .crud_notification import notification
from .crud_store import store
from .crud_store_products import store_product