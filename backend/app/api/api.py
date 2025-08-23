# filepath: backend/app/api/api.py
from fastapi import APIRouter

from app.api.endpoints import users, communities, customers, addresses, warehouses, products, login, orders, vendors, milestone, crates, racks, bins, notifications, stores, config, inbound, drivers, vehicles, bays, outbound

api_router = APIRouter()
api_router.include_router(login.router, tags=["Login"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(communities.router, prefix="/communities", tags=["Communities"])  # Replaces RWAs and Flats
api_router.include_router(customers.router, prefix="/customers", tags=["Customers"])
api_router.include_router(addresses.router, prefix="/addresses", tags=["Addresses"])
api_router.include_router(warehouses.router, prefix="/warehouses", tags=["Warehouses"])
api_router.include_router(products.router, prefix="/products", tags=["Products"])
api_router.include_router(orders.router, prefix="/orders", tags=["Orders"])
api_router.include_router(vendors.router, prefix="/vendors", tags=["Vendors"])
api_router.include_router(milestone.router, prefix="/milestones", tags=["Milestones"])
api_router.include_router(crates.router, prefix="/crates", tags=["Crates"])
api_router.include_router(racks.router, tags=["Racks"])
api_router.include_router(bins.router, tags=["Bins"])
api_router.include_router(bays.router, tags=["Bays"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(stores.router, prefix="/stores", tags=["Stores"])
api_router.include_router(config.router, tags=["Configuration"])
api_router.include_router(inbound.router)
api_router.include_router(drivers.router, prefix="/drivers", tags=["Drivers"])
api_router.include_router(vehicles.router, prefix="/vehicles", tags=["Vehicles"])
api_router.include_router(outbound.router, tags=["Outbound"])