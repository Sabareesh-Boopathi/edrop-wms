from typing import List
import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.crud import crud_product
from app.models.user import User
from app.schemas.product import Product, ProductCreate, ProductUpdate

router = APIRouter()
logger = logging.getLogger("app.api.endpoints.products")

@router.get("/", response_model=List[Product])
def read_products(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
):
    logger.info(f"ℹ️ User '{current_user.id}' listing all products.")
    return crud_product.product.get_multi(db, skip=skip, limit=limit)

@router.post("/", response_model=Product)
def create_product(
    product_in: ProductCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    logger.info(f"ℹ️ User '{current_user.id}' attempting to create product: {product_in.name}")
    new_product = crud_product.product.create(db, obj_in=product_in)
    logger.info(f"✅ Product '{new_product.id}' created successfully by user '{current_user.id}'.")
    return new_product

@router.get("/{product_id}", response_model=Product)
def read_product(
    product_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    logger.info(f"ℹ️ User '{current_user.id}' requesting product '{product_id}'.")
    db_product = crud_product.product.get(db, id=product_id)
    if db_product is None:
        logger.warning(f"❌ Product '{product_id}' not found for request from user '{current_user.id}'.")
        raise HTTPException(status_code=404, detail="Product not found")
    return db_product

@router.put("/{product_id}", response_model=Product)
def update_product(
    product_id: uuid.UUID,
    product_in: ProductUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    logger.info(f"ℹ️ User '{current_user.id}' attempting to update product '{product_id}'.")
    db_product = crud_product.product.get(db, id=product_id)
    if db_product is None:
        logger.warning(f"❌ Product '{product_id}' not found for update attempt by user '{current_user.id}'.")
        raise HTTPException(status_code=404, detail="Product not found")
    updated_product = crud_product.product.update(db, db_obj=db_product, obj_in=product_in)
    logger.info(f"✅ Product '{updated_product.id}' updated successfully by user '{current_user.id}'.")
    return updated_product

@router.delete("/{product_id}", response_model=Product)
def delete_product(
    product_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser), # Admin only
):
    logger.info(f"ℹ️ Admin '{current_user.id}' attempting to delete product '{product_id}'.")
    db_product = crud_product.product.get(db, id=product_id)
    if db_product is None:
        logger.warning(f"❌ Product '{product_id}' not found for deletion attempt by admin '{current_user.id}'.")
        raise HTTPException(status_code=404, detail="Product not found")
    deleted_product = crud_product.product.remove(db, id=product_id)
    logger.info(f"✅ Product '{deleted_product.id}' deleted successfully by admin '{current_user.id}'.")
    return deleted_product