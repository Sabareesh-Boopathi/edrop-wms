import logging
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from math import radians, sin, cos, asin, sqrt

from app.api import deps
from app import crud, models, schemas

router = APIRouter()
logger = logging.getLogger("app.api.endpoints.stores")

@router.get("/", response_model=List[schemas.Store])
def list_stores(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_user),
):
    logger.info(f"ℹ️ User '{current_user.id}' listing stores: skip={skip}, limit={limit}")
    return crud.store.get_multi(db, skip=skip, limit=limit)

@router.get("/by-vendor/{vendor_id}", response_model=List[schemas.Store])
def get_stores_by_vendor(
    vendor_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
):
    logger.info(f"ℹ️ User '{current_user.id}' listing stores by vendor '{vendor_id}'")
    return crud.store.get_multi_by_vendor(db, vendor_id=vendor_id)

@router.post("/", response_model=schemas.Store)
def create_store(
    store_in: schemas.StoreCreate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
):
    logger.info(f"ℹ️ User '{current_user.id}' creating store '{store_in.store_name}' for vendor '{store_in.vendor_id}'")
    # Ensure vendor exists
    vendor = crud.vendor.get(db, id=str(store_in.vendor_id))
    if not vendor:
        logger.warning(f"❌ Vendor '{store_in.vendor_id}' not found while creating store")
        raise HTTPException(status_code=404, detail="Vendor not found")
    return crud.store.create(db, obj_in=store_in)

@router.get("/{store_id}", response_model=schemas.Store)
def get_store(
    store_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
):
    store = crud.store.get(db, id=store_id)
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    return store

@router.put("/{store_id}", response_model=schemas.Store)
def update_store(
    store_id: uuid.UUID,
    store_in: schemas.StoreUpdate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
):
    db_store = crud.store.get(db, id=store_id)
    if not db_store:
        raise HTTPException(status_code=404, detail="Store not found")
    return crud.store.update(db, db_obj=db_store, obj_in=store_in)

@router.delete("/{store_id}", response_model=schemas.Store)
def delete_store(
    store_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_superuser),
):
    db_store = crud.store.get(db, id=store_id)
    if not db_store:
        raise HTTPException(status_code=404, detail="Store not found")
    return crud.store.remove(db, id=store_id)

# StoreProducts nested under store
@router.get("/{store_id}/products", response_model=List[schemas.StoreProduct])
def list_store_products(
    store_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
):
    return crud.store_product.get_all_by_store(db, store_id=str(store_id))

@router.post("/{store_id}/products", response_model=schemas.StoreProduct)
def add_store_product(
    store_id: uuid.UUID,
    item: schemas.StoreProductCreate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
):
    # Ensure the store_id in the payload matches path or override
    payload = item.copy(update={"store_id": store_id})
    return crud.store_product.create(db, obj_in=payload)

@router.put("/{store_id}/products/{store_product_id}", response_model=schemas.StoreProduct)
def update_store_product(
    store_id: uuid.UUID,
    store_product_id: uuid.UUID,
    item: schemas.StoreProductUpdate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
):
    db_sp = crud.store_product.get(db, id=store_product_id)
    if not db_sp or str(db_sp.store_id) != str(store_id):
        raise HTTPException(status_code=404, detail="StoreProduct not found")
    return crud.store_product.update(db, db_obj=db_sp, obj_in=item)

@router.delete("/{store_id}/products/{store_product_id}", response_model=schemas.StoreProduct)
def delete_store_product(
    store_id: uuid.UUID,
    store_product_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_superuser),
):
    db_sp = crud.store_product.get(db, id=store_product_id)
    if not db_sp or str(db_sp.store_id) != str(store_id):
        raise HTTPException(status_code=404, detail="StoreProduct not found")
    return crud.store_product.remove(db, id=store_product_id)

@router.get("/nearby", response_model=List[schemas.Store])
def list_nearby_stores(
    lat: float = Query(..., description="Customer latitude"),
    lon: float = Query(..., description="Customer longitude"),
    radius_km: float = Query(10.0, description="Search radius in kilometers"),
    vendor_id: Optional[uuid.UUID] = Query(None, description="Optional vendor filter"),
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
):
    """Return stores within radius_km of (lat, lon)."""
    def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        # convert decimal degrees to radians
        lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
        dlon = lon2 - lon1
        dlat = lat2 - lat1
        a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
        c = 2 * asin(sqrt(a))
        R = 6371.0  # Radius of earth in kilometers
        return R * c

    q = db.query(models.Store).filter(models.Store.latitude.isnot(None), models.Store.longitude.isnot(None))
    if vendor_id is not None:
        q = q.filter(models.Store.vendor_id == vendor_id)
    stores = q.all()

    results = []
    for s in stores:
        try:
            s_lat = float(s.latitude)
            s_lon = float(s.longitude)
        except Exception:
            # Skip stores with non-castable coords
            continue
        dist = haversine_km(lat, lon, s_lat, s_lon)
        if dist <= radius_km:
            results.append((dist, s))

    results.sort(key=lambda t: t[0])
    return [s for _, s in results]
