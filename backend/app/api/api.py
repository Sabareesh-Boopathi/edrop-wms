# filepath: backend/app/api/api.py
from fastapi import APIRouter

from app.api.endpoints import users, rwas, flats, customers, warehouses, products, login, orders, vendors, milestone, crates, racks, bins, notifications, stores, config

api_router = APIRouter()
api_router.include_router(login.router, tags=["Login"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(rwas.router, prefix="/rwas", tags=["RWAs"])
api_router.include_router(flats.router, prefix="/flats", tags=["Flats"])
api_router.include_router(customers.router, prefix="/customers", tags=["Customers"])
api_router.include_router(warehouses.router, prefix="/warehouses", tags=["Warehouses"])
api_router.include_router(products.router, prefix="/products", tags=["Products"])
api_router.include_router(orders.router, prefix="/orders", tags=["Orders"])
api_router.include_router(vendors.router, prefix="/vendors", tags=["Vendors"])
api_router.include_router(milestone.router, prefix="/milestones", tags=["Milestones"])
api_router.include_router(crates.router, prefix="/crates", tags=["Crates"])
api_router.include_router(racks.router, tags=["Racks"])
api_router.include_router(bins.router, tags=["Bins"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(stores.router, prefix="/stores", tags=["Stores"])
api_router.include_router(config.router, tags=["Configuration"])