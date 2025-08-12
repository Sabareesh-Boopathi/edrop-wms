import logging
from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import uuid

from app import crud, models, schemas
from app.api import deps

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/me", response_model=schemas.Vendor)
def read_own_vendor_profile(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Get the vendor profile for the authenticated user.
    """
    logger.info(f"🔎 Fetching own vendor profile for user {current_user.email} (id: {current_user.id})")
    vendor = crud.vendor.get_by_user(db, user_id=current_user.id)
    if not vendor:
        logger.warning(f"❌ Vendor profile not found for user {current_user.email} (id: {current_user.id})")
        raise HTTPException(status_code=404, detail="Vendor profile not found for this user.")
    logger.info(f"✅ Vendor profile found for user {current_user.email} (id: {current_user.id})")
    return vendor

@router.get("/summary", response_model=List[schemas.VendorSummary])
def list_vendor_summaries(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user)
) -> Any:
    """Return vendors with store_count and product_count (across their stores)."""
    vendors = crud.vendor.get_multi(db)
    result: list[schemas.VendorSummary] = []
    for v in vendors:
        store_count = db.query(models.Store).filter(models.Store.vendor_id == v.id).count()
        # Count distinct products across all stores for this vendor
        from app.models.store_products import StoreProduct
        product_count = (
            db.query(StoreProduct.product_id)
            .join(models.Store, StoreProduct.store_id == models.Store.id)
            .filter(models.Store.vendor_id == v.id)
            .distinct()
            .count()
        )
        result.append(
            schemas.VendorSummary(
                id=v.id,
                business_name=v.business_name,
                email=v.email,
                phone_number=v.phone_number,
                vendor_type=v.vendor_type,
                vendor_status=v.vendor_status,
                store_count=store_count,
                product_count=product_count,
            )
        )
    return result

@router.get("/{vendor_id}", response_model=schemas.Vendor)
def read_vendor_by_id(
    vendor_id: str,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Retrieve a vendor profile by its ID.
    """
    logger.info(f"🔎 Admin {current_user.email} (id: {current_user.id}) fetching vendor profile by id: {vendor_id}")
    vendor = crud.vendor.get(db, id=vendor_id)
    if not vendor:
        logger.warning(f"❌ Vendor profile not found for id: {vendor_id}")
        raise HTTPException(status_code=404, detail="Vendor not found.")
    logger.info(f"✅ Vendor profile found for id: {vendor_id}")
    return vendor

@router.post("/", response_model=schemas.Vendor)
def create_vendor_profile(
    vendor_in: schemas.VendorCreate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_superuser)
) -> Any:
    """
    Create a new vendor profile for the authenticated user.
    """
    logger.info(f"📝 Admin {current_user.email} (id: {current_user.id}) attempting to create vendor profile.")
    vendor = crud.vendor.create(db, obj_in=vendor_in)
    logger.info(f"✅ Vendor profile created successfully, vendor_id: {vendor.id}")
    return vendor

@router.get("/", response_model=List[schemas.Vendor])
def read_vendors(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    🏪 Retrieve all vendors.
    """
    logger.info(f"🏪 Fetching all vendors. skip={skip}, limit={limit}")
    vendors = crud.vendor.get_multi(db, skip=skip, limit=limit)
    logger.info(f"✅ {len(vendors)} vendors returned.")
    return vendors

@router.put("/{id}", response_model=schemas.Vendor)
def update_vendor(
    *,
    db: Session = Depends(deps.get_db),
    id: uuid.UUID,
    vendor_in: schemas.VendorUpdate
) -> Any:
    """
    Update a vendor profile.
    """
    logger.info(f"✏️ Attempting to update vendor profile {id}.")
    db_vendor = crud.vendor.get(db, id=id)
    if not db_vendor:
        logger.warning(f"❌ Vendor profile not found for id: {id}")
        raise HTTPException(status_code=404, detail="Vendor not found.")
    updated_vendor = crud.vendor.update(db, db_obj=db_vendor, obj_in=vendor_in)
    logger.info(f"✅ Vendor profile {id} updated successfully.")
    return updated_vendor

@router.delete("/{vendor_id}", response_model=schemas.Vendor)
def delete_vendor(
    *,
    db: Session = Depends(deps.get_db),
    vendor_id: str,
    current_user: models.User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Delete a vendor profile. (Admins only)
    """
    logger.info(f"🗑️ Admin {current_user.email} (id: {current_user.id}) attempting to delete vendor profile {vendor_id}.")
    db_vendor = crud.vendor.get(db, id=vendor_id)
    if not db_vendor:
        logger.warning(f"❌ Vendor profile not found for id: {vendor_id}")
        raise HTTPException(status_code=404, detail="Vendor not found.")
    deleted_vendor = crud.vendor.remove(db, id=vendor_id)
    logger.info(f"✅ Vendor profile {vendor_id} deleted successfully by admin {current_user.email}.")
    return deleted_vendor

@router.get("/{vendor_id}/stores", response_model=List[schemas.Store])
def get_vendor_stores(
    vendor_id: str,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve all stores associated with a vendor.
    """
    logger.info(f"🔍 User '{current_user.email}' fetching stores for vendor '{vendor_id}'.")
    stores = crud.store.get_multi_by_vendor(db, vendor_id=vendor_id)
    logger.info(f"✅ {len(stores)} stores found for vendor '{vendor_id}'.")
    return stores
