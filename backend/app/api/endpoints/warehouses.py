from typing import List
import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.crud import crud_warehouse
from app.models.user import User
from app.schemas.warehouse import Warehouse, WarehouseCreate, WarehouseUpdate

router = APIRouter()
logger = logging.getLogger("app.api.endpoints.warehouses")

@router.get("/", response_model=List[Warehouse])
def read_warehouses(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
):
    logger.info(f"ℹ️ User '{current_user.id}' listing all warehouses.")
    return crud_warehouse.warehouse.get_multi(db, skip=skip, limit=limit)

@router.post("/", response_model=Warehouse)
def create_warehouse(
    warehouse_in: WarehouseCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    logger.info(f"ℹ️ User '{current_user.id}' attempting to create warehouse: {warehouse_in.name}")
    new_warehouse = crud_warehouse.warehouse.create(db, obj_in=warehouse_in)
    logger.info(f"✅ Warehouse '{new_warehouse.id}' created successfully by user '{current_user.id}'.")
    return new_warehouse

@router.get("/{warehouse_id}", response_model=Warehouse)
def read_warehouse(
    warehouse_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    logger.info(f"ℹ️ User '{current_user.id}' requesting warehouse '{warehouse_id}'.")
    db_warehouse = crud_warehouse.warehouse.get(db, id=warehouse_id)
    if db_warehouse is None:
        logger.warning(f"❌ Warehouse '{warehouse_id}' not found for request from user '{current_user.id}'.")
        raise HTTPException(status_code=404, detail="Warehouse not found")
    return db_warehouse

@router.put("/{warehouse_id}", response_model=Warehouse)
def update_warehouse(
    warehouse_id: uuid.UUID,
    warehouse_in: WarehouseUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    logger.info(f"ℹ️ User '{current_user.id}' attempting to update warehouse '{warehouse_id}'.")
    db_warehouse = crud_warehouse.warehouse.get(db, id=warehouse_id)
    if db_warehouse is None:
        logger.warning(f"❌ Warehouse '{warehouse_id}' not found for update attempt by user '{current_user.id}'.")
        raise HTTPException(status_code=404, detail="Warehouse not found")
    updated_warehouse = crud_warehouse.warehouse.update(db, db_obj=db_warehouse, obj_in=warehouse_in)
    logger.info(f"✅ Warehouse '{updated_warehouse.id}' updated successfully by user '{current_user.id}'.")
    return updated_warehouse

@router.delete("/{warehouse_id}", response_model=Warehouse)
def delete_warehouse(
    warehouse_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser), # Admin only
):
    logger.info(f"ℹ️ Admin '{current_user.id}' attempting to delete warehouse '{warehouse_id}'.")
    db_warehouse = crud_warehouse.warehouse.get(db, id=warehouse_id)
    if db_warehouse is None:
        logger.warning(f"❌ Warehouse '{warehouse_id}' not found for deletion attempt by admin '{current_user.id}'.")
        raise HTTPException(status_code=404, detail="Warehouse not found")
    deleted_warehouse = crud_warehouse.warehouse.remove(db, id=warehouse_id)
    logger.info(f"✅ Warehouse '{deleted_warehouse.id}' deleted successfully by admin '{current_user.id}'.")
    return deleted_warehouse