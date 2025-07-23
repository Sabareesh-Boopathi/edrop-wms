from typing import List
import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.crud import crud_customer
from app.models.user import User
from app.schemas.customer import Customer, CustomerCreate, CustomerUpdate

router = APIRouter()
logger = logging.getLogger("app.api.endpoints.customers")

@router.get("/", response_model=List[Customer])
def read_customers(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
):
    logger.info(f"ℹ️ User '{current_user.id}' listing all customers.")
    return crud_customer.customer.get_multi(db, skip=skip, limit=limit)

@router.post("/", response_model=Customer)
def create_customer(
    customer_in: CustomerCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    logger.info(f"ℹ️ User '{current_user.id}' attempting to create customer for user: {customer_in.user_id}")
    new_customer = crud_customer.customer.create(db, obj_in=customer_in)
    logger.info(f"✅ Customer '{new_customer.id}' created successfully by user '{current_user.id}'.")
    return new_customer

@router.get("/{customer_id}", response_model=Customer)
def read_customer(
    customer_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    logger.info(f"ℹ️ User '{current_user.id}' requesting customer '{customer_id}'.")
    db_customer = crud_customer.customer.get(db, id=customer_id)
    if db_customer is None:
        logger.warning(f"❌ Customer '{customer_id}' not found for request from user '{current_user.id}'.")
        raise HTTPException(status_code=404, detail="Customer not found")
    return db_customer

@router.put("/{customer_id}", response_model=Customer)
def update_customer(
    customer_id: uuid.UUID,
    customer_in: CustomerUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    logger.info(f"ℹ️ User '{current_user.id}' attempting to update customer '{customer_id}'.")
    db_customer = crud_customer.customer.get(db, id=customer_id)
    if db_customer is None:
        logger.warning(f"❌ Customer '{customer_id}' not found for update attempt by user '{current_user.id}'.")
        raise HTTPException(status_code=404, detail="Customer not found")
    updated_customer = crud_customer.customer.update(db, db_obj=db_customer, obj_in=customer_in)
    logger.info(f"✅ Customer '{updated_customer.id}' updated successfully by user '{current_user.id}'.")
    return updated_customer

@router.delete("/{customer_id}", response_model=Customer)
def delete_customer(
    customer_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser), # Admin only
):
    logger.info(f"ℹ️ Admin '{current_user.id}' attempting to delete customer '{customer_id}'.")
    db_customer = crud_customer.customer.get(db, id=customer_id)
    if db_customer is None:
        logger.warning(f"❌ Customer '{customer_id}' not found for deletion attempt by admin '{current_user.id}'.")
        raise HTTPException(status_code=404, detail="Customer not found")
    deleted_customer = crud_customer.customer.remove(db, id=customer_id)
    logger.info(f"✅ Customer '{deleted_customer.id}' deleted successfully by admin '{current_user.id}'.")
    return deleted_customer