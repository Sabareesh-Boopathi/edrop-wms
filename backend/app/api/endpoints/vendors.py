import logging
from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

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
    current_user: models.User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Create a new vendor profile for the authenticated user.
    """
    logger.info(f"📝 User {current_user.email} (id: {current_user.id}) attempting to create vendor profile.")
    if vendor_in.user_id != current_user.id:
        logger.warning(f"❌ User {current_user.email} (id: {current_user.id}) tried to create vendor profile for another user (payload user_id: {vendor_in.user_id})")
        raise HTTPException(status_code=403, detail="You can only create a vendor profile for your own user account.")
    existing_vendor = crud.vendor.get_by_user(db, user_id=current_user.id)
    if existing_vendor:
        logger.warning(f"❌ Vendor profile already exists for user {current_user.email} (id: {current_user.id})")
        raise HTTPException(status_code=400, detail="A vendor profile for this user already exists.")
    vendor = crud.vendor.create(db, obj_in=vendor_in)
    logger.info(f"✅ Vendor profile created for user {current_user.email} (id: {current_user.id}), vendor_id: {vendor.id}")
    return vendor

@router.get("/", response_model=List[schemas.Vendor])
def read_vendors(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    🏪 Retrieve all vendors.
    """
    logger.info(f"🏪 User {current_user.email} (id: {current_user.id}) fetching all vendors. skip={skip}, limit={limit}")
    vendors = crud.vendor.get_multi(db, skip=skip, limit=limit)
    logger.info(f"✅ {len(vendors)} vendors returned.")
    return vendors
