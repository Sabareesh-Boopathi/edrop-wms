from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from app.api import deps
from app import models
from app.crud.crud_vehicle import vehicle as crud_vehicle
from app.schemas.vehicle import Vehicle as VehicleSchema, VehicleCreate, VehicleUpdate

router = APIRouter()


@router.get("/", response_model=List[VehicleSchema])
def list_vehicles(
    warehouse_id: Optional[uuid.UUID] = None,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
):
    role = str(getattr(current_user, "role", "")).upper()
    effective_warehouse_id = getattr(current_user, "warehouse_id", None) if role != "ADMIN" else warehouse_id
    return crud_vehicle.get_multi_by_warehouse(db, warehouse_id=effective_warehouse_id or warehouse_id)


@router.post("/", response_model=VehicleSchema)
def create_vehicle(
    payload: VehicleCreate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    _=Depends(deps.ensure_not_viewer_for_write),
):
    role = str(getattr(current_user, "role", "")).upper()
    if role != "ADMIN":
        if not getattr(current_user, "warehouse_id", None):
            raise HTTPException(status_code=403, detail="Missing warehouse assignment")
        if str(payload.warehouse_id) != str(current_user.warehouse_id):
            raise HTTPException(status_code=403, detail="Cannot create outside your warehouse")
    return crud_vehicle.create(db, obj_in=payload)


@router.get("/{vehicle_id}", response_model=VehicleSchema)
def get_vehicle(
    vehicle_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
):
    obj = crud_vehicle.get(db, id=vehicle_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return obj


@router.put("/{vehicle_id}", response_model=VehicleSchema)
def update_vehicle(
    vehicle_id: uuid.UUID,
    payload: VehicleUpdate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    _=Depends(deps.ensure_not_viewer_for_write),
):
    obj = crud_vehicle.get(db, id=vehicle_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    role = str(getattr(current_user, "role", "")).upper()
    if role != "ADMIN":
        if not getattr(current_user, "warehouse_id", None):
            raise HTTPException(status_code=403, detail="Missing warehouse assignment")
        if str(obj.warehouse_id) != str(current_user.warehouse_id):
            raise HTTPException(status_code=403, detail="Cannot modify outside your warehouse")
    return crud_vehicle.update(db, db_obj=obj, obj_in=payload)


@router.delete("/{vehicle_id}")
def delete_vehicle(
    vehicle_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_superuser),
):
    obj = crud_vehicle.remove(db, id=vehicle_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return {"status": "deleted"}
