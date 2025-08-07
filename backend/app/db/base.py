# filepath: backend/app/db/base.py
# This file is used to ensure all models are imported before initializing the DB
# so that they are registered properly on the metadata. Otherwise, Alembic
# will not be able to detect new tables or columns.

from app.db.base_class import Base
from app.models.user import User

# When you create new models, import them here as well.
from app.models.rwa import RWA
from app.models.flat import Flat
from app.models.customer import Customer
from app.models.warehouse import Warehouse
from app.models.product import Product
from app.models.order import Order
from app.models.order_product import OrderProduct
from app.models.vendor import Vendor
from app.models.store import Store
from app.models.milestone import Milestone
from app.models.crate import Crate