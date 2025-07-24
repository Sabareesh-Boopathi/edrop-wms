from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import logging
from typing import List
import uuid

from app import crud, models, schemas
from app.api import deps

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/me", response_model=schemas.Customer)
def read_customer_me(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
):
    """
    Get current user's customer profile.
    """
    logger.info(f"ℹ️ Endpoint /customers/me called by user: {current_user.email} (id: {current_user.id})")
    customer = crud.customer.get_by_user_id(db, user_id=current_user.id)
    if not customer:
        logger.warning(f"❌ No customer profile found for user_id: {current_user.id}")
        raise HTTPException(status_code=404, detail="Customer profile not found for the current user")
    logger.info(f"✅ Found customer profile (id: {customer.id}) for user_id: {current_user.id}")
    return customer

@router.get("/", response_model=List[schemas.Customer])
def read_customers(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_superuser),
):
    """
    Retrieve all customer profiles (Superuser only).
    """
    customers = crud.customer.get_multi(db, skip=skip, limit=limit)
    return customers

# --- Start of Corrected Endpoints ---

@router.post("/", response_model=schemas.Customer)
def create_customer(
    customer_in: schemas.CustomerCreate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
):
    logger.info(f"📝 User '{current_user.id}' attempting to create customer for user: {customer_in.user_id}")
    new_customer = crud.customer.create(db, obj_in=customer_in)
    logger.info(f"✅ Customer '{new_customer.id}' created successfully by user '{current_user.id}'.")
    return new_customer

@router.get("/{customer_id}", response_model=schemas.Customer)
def read_customer(
    customer_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
):
    logger.info(f"🔎 User '{current_user.id}' requesting customer '{customer_id}'.")
    db_customer = crud.customer.get(db, id=customer_id)
    if db_customer is None:
        logger.warning(f"❌ Customer '{customer_id}' not found for request from user '{current_user.id}'.")
        raise HTTPException(status_code=404, detail="Customer not found")
    return db_customer

@router.put("/{customer_id}", response_model=schemas.Customer)
def update_customer(
    customer_id: uuid.UUID,
    customer_in: schemas.CustomerUpdate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
):
    logger.info(f"📝 User '{current_user.id}' attempting to update customer '{customer_id}'.")
    db_customer = crud.customer.get(db, id=customer_id)
    if db_customer is None:
        logger.warning(f"❌ Customer '{customer_id}' not found for update attempt by user '{current_user.id}'.")
        raise HTTPException(status_code=404, detail="Customer not found")
    updated_customer = crud.customer.update(db, db_obj=db_customer, obj_in=customer_in)
    logger.info(f"✅ Customer '{updated_customer.id}' updated successfully by user '{current_user.id}'.")
    return updated_customer

@router.delete("/{customer_id}", response_model=schemas.Customer)
def delete_customer(
    customer_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_superuser), # Admin only
):
    logger.info(f"🗑️ Admin '{current_user.id}' attempting to delete customer '{customer_id}'.")
    db_customer = crud.customer.get(db, id=customer_id)
    if db_customer is None:
        logger.warning(f"❌ Customer '{customer_id}' not found for deletion attempt by admin '{current_user.id}'.")
        raise HTTPException(status_code=404, detail="Customer not found")
    deleted_customer = crud.customer.remove(db, id=customer_id)
    logger.info(f"✅ Customer '{deleted_customer.id}' deleted successfully by admin '{current_user.id}'.")
    return deleted_customer