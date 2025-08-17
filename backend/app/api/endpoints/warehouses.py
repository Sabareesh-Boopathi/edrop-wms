from typing import List
import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.crud import crud_warehouse
from app.models.user import User
from app.schemas.warehouse import Warehouse, WarehouseCreate, WarehouseUpdate
from app.schemas.inventory import WarehouseInventoryRow  # schema for enriched inventory rows
from fastapi import Query
from app.schemas.crate import Crate  # Import the Crate schema

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

@router.get("/{warehouse_id}/products")
def get_warehouse_products(
    warehouse_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(25, ge=1, le=500),
    sort_by: str = Query("product_name"),
    sort_dir: str = Query("asc"),
    q: str | None = Query(None),
):
    """
    Retrieve all products stored in a warehouse.
    """
    logger.info(f"🔍 User '{current_user.id}' fetching products for warehouse '{warehouse_id}'.")
    # Assuming a method exists to fetch products by warehouse
    data = crud_warehouse.warehouse.get_products(
        db,
        warehouse_id=warehouse_id,
        skip=skip,
        limit=limit,
        sort_by=sort_by,
        sort_dir=sort_dir,
        q=q,
    )
    # response: { items: WarehouseInventoryRow[], total: number }
    data["items"] = [WarehouseInventoryRow(**r) for r in data["items"]]
    return data

@router.get("/{warehouse_id}/crates", response_model=List[Crate])
def get_warehouse_crates(
    warehouse_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Retrieve all crates stored in a warehouse.
    """
    logger.info(f"🔍 User '{current_user.id}' fetching crates for warehouse '{warehouse_id}'.")
    try:
        warehouse = crud_warehouse.warehouse.get_with_crates(db, id=warehouse_id)
        if not warehouse:
            logger.warning(f"❌ Warehouse '{warehouse_id}' not found for crates request from user '{current_user.id}'.")
            raise HTTPException(status_code=404, detail="Warehouse not found")
        logger.info(f"✅ Crates for warehouse '{warehouse_id}' fetched successfully by user '{current_user.id}'.")
        return warehouse.crates
    except Exception as e:
        logger.error(f"❌ Error fetching crates for warehouse '{warehouse_id}': {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")