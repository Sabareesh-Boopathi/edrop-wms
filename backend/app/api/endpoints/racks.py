# filepath: backend/app/api/endpoints/racks.py
from typing import List
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.crud import crud_rack
from app.schemas.rack import Rack, RackCreateRequest, RackUpdate, RackOut
from app.models.user import User

router = APIRouter()

@router.get("/warehouses/{warehouse_id}/racks", response_model=List[RackOut])
def list_racks(
    warehouse_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    return crud_rack.rack.list_with_stats_by_warehouse(db, warehouse_id)

@router.post("/racks", response_model=RackOut)
def create_rack(
    rack_in: RackCreateRequest,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    # Delegate to CRUD which generates the name using config sequencing
    created = crud_rack.rack.create(db, obj_in=rack_in)
    return crud_rack.rack.with_stats(db, created)

@router.put("/racks/{rack_id}", response_model=RackOut)
def update_rack(
    rack_id: uuid.UUID,
    rack_in: RackUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    db_rack = crud_rack.rack.get(db, id=rack_id)
    if not db_rack:
        raise HTTPException(status_code=404, detail="Rack not found")
    updated = crud_rack.rack.update(db, db_obj=db_rack, obj_in=rack_in)
    return crud_rack.rack.with_stats(db, updated)

@router.delete("/racks/{rack_id}", response_model=Rack)
def delete_rack(
    rack_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
):
    db_rack = crud_rack.rack.get(db, id=rack_id)
    if not db_rack:
        raise HTTPException(status_code=404, detail="Rack not found")
    return crud_rack.rack.remove(db, id=rack_id)
