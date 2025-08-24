# filepath: backend/app/api/endpoints/bins.py
from typing import List
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import re
from app.api import deps
from app.crud import crud_bin, crud_rack
from app.schemas.bin import Bin, BinCreate, BinUpdate, BinCreateRequest
from app.models.user import User
from app.crud.crud_config import config as cfg
from app.services.bin_code import build_bin_code as build_bin_code_svc

router = APIRouter()

@router.get("/racks/{rack_id}/bins", response_model=List[Bin])
def list_bins(
    rack_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    # ensure rack exists
    if not crud_rack.rack.get(db, id=rack_id):
        raise HTTPException(status_code=404, detail="Rack not found")
    return crud_bin.bin.get_by_rack(db, rack_id)

def build_bin_code(db: Session, rack_id: uuid.UUID, stack_index: int, bin_index: int) -> str:  # backwards import path compatibility
    return build_bin_code_svc(db, rack_id, stack_index, bin_index)

@router.post("/racks/{rack_id}/bins", response_model=Bin)
def create_bin(
    rack_id: uuid.UUID,
    bin_in: BinCreateRequest,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    if not crud_rack.rack.get(db, id=rack_id):
        raise HTTPException(status_code=404, detail="Rack not found")
    code = build_bin_code(db, rack_id, bin_in.stack_index, bin_in.bin_index)
    payload = BinCreate(
        rack_id=rack_id,
        stack_index=bin_in.stack_index,
        bin_index=bin_in.bin_index,
        code=code,
        status=bin_in.status,
        crate_id=bin_in.crate_id,
        product_id=bin_in.product_id,
        store_product_id=bin_in.store_product_id,
        quantity=bin_in.quantity,
    )
    return crud_bin.bin.create(db, obj_in=payload)

@router.post("/racks/{rack_id}/bins:materialize")
def materialize_bins(
    rack_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """Create any missing Bin rows to fill the rack's stacks x bins_per_stack grid.

    Returns a summary with counts and how many were created.
    """
    rack = crud_rack.rack.get(db, id=rack_id)
    if not rack:
        raise HTTPException(status_code=404, detail="Rack not found")
    # Load existing coordinates for this rack
    existing = crud_bin.bin.get_by_rack(db, rack_id)
    coords = {(int(b.stack_index), int(b.bin_index)) for b in existing}
    to_create = []
    for s in range(int(rack.stacks or 0)):
        for b in range(int(rack.bins_per_stack or 0)):
            if (s, b) in coords:
                continue
            code = build_bin_code(db, rack_id, s, b)
            to_create.append(BinCreate(
                rack_id=rack_id,
                stack_index=s,
                bin_index=b,
                code=code,
                status="empty",
                crate_id=None,
                product_id=None,
                store_product_id=None,
                quantity=0,
            ))
    created = 0
    for payload in to_create:
        crud_bin.bin.create(db, obj_in=payload)
        created += 1
    # Summarize
    total_expected = int((rack.stacks or 0) * (rack.bins_per_stack or 0))
    return {
        "rack_id": str(rack.id),
        "rack_name": rack.name,
        "expected": total_expected,
        "existing": len(existing),
        "created": created,
    }

@router.put("/bins/{bin_id}", response_model=Bin)
def update_bin(
    bin_id: uuid.UUID,
    bin_in: BinUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    db_bin = crud_bin.bin.get(db, id=bin_id)
    if not db_bin:
        raise HTTPException(status_code=404, detail="Bin not found")
    # Recompute code if indices change
    new_stack = bin_in.stack_index if bin_in.stack_index is not None else db_bin.stack_index
    new_bin = bin_in.bin_index if bin_in.bin_index is not None else db_bin.bin_index
    new_code = build_bin_code(db, db_bin.rack_id, int(new_stack), int(new_bin))
    update_payload = { **bin_in.model_dump(exclude_unset=True), 'code': new_code }
    return crud_bin.bin.update(db, db_obj=db_bin, obj_in=update_payload)

@router.delete("/bins/{bin_id}", response_model=Bin)
def delete_bin(
    bin_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
):
    db_bin = crud_bin.bin.get(db, id=bin_id)
    if not db_bin:
        raise HTTPException(status_code=404, detail="Bin not found")
    return crud_bin.bin.remove(db, id=bin_id)
