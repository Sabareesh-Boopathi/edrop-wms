# filepath: backend/app/api/api.py
from fastapi import APIRouter

from app.api.endpoints import users, rwas, flats, customers, warehouses, products, login, orders, vendors

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