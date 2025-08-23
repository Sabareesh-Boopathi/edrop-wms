from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from app.api import deps
from app import models
from app.crud.crud_driver import driver as crud_driver
from app.schemas.driver import Driver as DriverSchema, DriverCreate, DriverUpdate

router = APIRouter()


@router.get("/", response_model=List[DriverSchema])
def list_drivers(
    warehouse_id: Optional[uuid.UUID] = None,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
):
    # Managers are scoped to their warehouse; admins/global can pass any
    role = str(getattr(current_user, "role", "")).upper()
    effective_warehouse_id = getattr(current_user, "warehouse_id", None) if role != "ADMIN" else warehouse_id
    return crud_driver.get_multi_by_warehouse(db, warehouse_id=effective_warehouse_id or warehouse_id)


@router.post("/", response_model=DriverSchema)
def create_driver(
    payload: DriverCreate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    _=Depends(deps.ensure_not_viewer_for_write),
):
    # Non-admins can only create within their own warehouse
    role = str(getattr(current_user, "role", "")).upper()
    if role != "ADMIN":
        if not getattr(current_user, "warehouse_id", None):
            raise HTTPException(status_code=403, detail="Missing warehouse assignment")
        if str(payload.warehouse_id) != str(current_user.warehouse_id):
            raise HTTPException(status_code=403, detail="Cannot create outside your warehouse")
    return crud_driver.create(db, obj_in=payload)


@router.get("/{driver_id}", response_model=DriverSchema)
def get_driver(
    driver_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
):
    obj = crud_driver.get(db, id=driver_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Driver not found")
    return obj


@router.put("/{driver_id}", response_model=DriverSchema)
def update_driver(
    driver_id: uuid.UUID,
    payload: DriverUpdate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    _=Depends(deps.ensure_not_viewer_for_write),
):
    obj = crud_driver.get(db, id=driver_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Driver not found")
    role = str(getattr(current_user, "role", "")).upper()
    if role != "ADMIN":
        if not getattr(current_user, "warehouse_id", None):
            raise HTTPException(status_code=403, detail="Missing warehouse assignment")
        if str(obj.warehouse_id) != str(current_user.warehouse_id):
            raise HTTPException(status_code=403, detail="Cannot modify outside your warehouse")
    return crud_driver.update(db, db_obj=obj, obj_in=payload)


@router.delete("/{driver_id}")
def delete_driver(
    driver_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_superuser),
):
    obj = crud_driver.remove(db, id=driver_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Driver not found")
    return {"status": "deleted"}
