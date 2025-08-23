from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
import logging
from typing import List, Optional
import uuid

from app import crud, models, schemas
from app.api import deps

router = APIRouter()
logger = logging.getLogger("app.api.endpoints.addresses")

@router.get("/", response_model=List[schemas.Address])
def read_addresses(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    city: Optional[str] = Query(None, description="Filter by city"),
    state: Optional[str] = Query(None, description="Filter by state"),
    pincode: Optional[str] = Query(None, description="Filter by pincode"),
    current_user: models.User = Depends(deps.get_current_active_user),
):
    """
    Retrieve addresses with optional filtering.
    """
    logger.info(
        "📒 Listing addresses skip=%s limit=%s filters city=%s state=%s pincode=%s by user=%s",
        skip, limit, city, state, pincode, getattr(current_user, "id", None)
    )
    if city or state or pincode:
        addresses = crud.address.search_by_location(
            db, city=city, state=state, pincode=pincode
        )
    else:
        addresses = crud.address.get_multi(db, skip=skip, limit=limit)
    logger.info("✅ Returned %d addresses", len(addresses))
    return addresses

@router.post("/", response_model=schemas.Address)
def create_address(
    *,
    db: Session = Depends(deps.get_db),
    address_in: schemas.AddressCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
):
    """
    Create new address.
    """
    logger.info(f"📝 User '{current_user.id}' creating new address")
    address = crud.address.create(db, obj_in=address_in)
    logger.info(f"✅ Address '{address.id}' created successfully by user '{current_user.id}'.")
    return address

@router.get("/{address_id}", response_model=schemas.Address)
def read_address(
    *,
    db: Session = Depends(deps.get_db),
    address_id: uuid.UUID,
    current_user: models.User = Depends(deps.get_current_active_user),
):
    """
    Get address by ID.
    """
    logger.info(f"🔎 User '{current_user.id}' requesting address '{address_id}'.")
    address = crud.address.get(db, id=address_id)
    if not address:
        logger.warning(f"❌ Address '{address_id}' not found for request from user '{current_user.id}'.")
        raise HTTPException(status_code=404, detail="Address not found")
    return address

@router.put("/{address_id}", response_model=schemas.Address)
def update_address(
    *,
    db: Session = Depends(deps.get_db),
    address_id: uuid.UUID,
    address_in: schemas.AddressUpdate,
    current_user: models.User = Depends(deps.get_current_active_user),
):
    """
    Update an address.
    """
    logger.info(f"📝 User '{current_user.id}' attempting to update address '{address_id}'.")
    address = crud.address.get(db, id=address_id)
    if not address:
        logger.warning(f"❌ Address '{address_id}' not found for update attempt by user '{current_user.id}'.")
        raise HTTPException(status_code=404, detail="Address not found")
    address = crud.address.update(db, db_obj=address, obj_in=address_in)
    logger.info(f"✅ Address '{address.id}' updated successfully by user '{current_user.id}'.")
    return address

@router.delete("/{address_id}", response_model=schemas.Address)
def delete_address(
    *,
    db: Session = Depends(deps.get_db),
    address_id: uuid.UUID,
    current_user: models.User = Depends(deps.get_current_active_superuser),  # Admin only
):
    """
    Delete an address.
    """
    logger.info(f"🗑️ Admin '{current_user.id}' attempting to delete address '{address_id}'.")
    address = crud.address.get(db, id=address_id)
    if not address:
        logger.warning(f"❌ Address '{address_id}' not found for deletion attempt by admin '{current_user.id}'.")
        raise HTTPException(status_code=404, detail="Address not found")
    address = crud.address.remove(db, id=address_id)
    logger.info(f"✅ Address '{address.id}' deleted successfully by admin '{current_user.id}'.")
    return address
