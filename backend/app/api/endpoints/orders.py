# filepath: c:\Users\priya\Projects\eDrop-UrbanHive\edrop-wms\backend\app\api\endpoints\orders.py
import logging
from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.api import deps

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/", response_model=schemas.Order, status_code=status.HTTP_201_CREATED)
def create_order(
    order_in: schemas.OrderCreate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create a new order. 📦
    """
    logger.info(f"📝 Creating new order for customer {order_in.customer_id} by user {current_user.email}")
    order = crud.order.create_with_items(db=db, obj_in=order_in)
    return order

@router.get("/", response_model=List[schemas.Order])
def read_orders(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_superuser), # Admin only
) -> Any:
    """
    Retrieve all orders (Admins only). 📄
    """
    logger.info(f"🔎 Admin {current_user.email} fetching all orders.")
    orders = crud.order.get_multi(db, skip=skip, limit=limit)
    logger.info(f"📄 {len(orders)} orders returned.")
    return orders

@router.get("/me", response_model=List[schemas.Order])
def read_my_orders(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve orders for the current customer user. 📦
    """
    # Find customer profile for current user
    customer = db.query(models.Customer).filter(models.Customer.user_id == current_user.id).first()
    if not customer:
        logger.warning(f"❌ Customer profile not found for user_id: {current_user.id}")
        raise HTTPException(status_code=404, detail="Customer profile not found.")
    orders = db.query(models.Order).filter(models.Order.customer_id == customer.id).all()
    logger.info(f"📦 {len(orders)} orders returned for customer {customer.id}.")
    return orders