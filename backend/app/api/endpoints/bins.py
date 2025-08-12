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

def build_bin_code(db: Session, rack_id: uuid.UUID, stack_index: int, bin_index: int) -> str:
        """Return canonical bin code.

        Format: [<short>-]<RACKPREFIX><rack_seq>-SXXX-BXXX
            - rack_seq extracted from trailing digits of rack.name, zero-padded to 3
            - S / B parts are 1-based indices, zero-padded to 3
        Ensures consistency even if legacy records used 1 or 2 digit padding.
        """
        rack = crud_rack.rack.get(db, id=rack_id)
        if not rack:
                raise HTTPException(status_code=404, detail="Rack not found")
        wh_cfg = cfg.get_warehouse(db, str(rack.warehouse_id)) or {}
        rack_prefix = (wh_cfg.get('rackPrefix') or 'R').upper()
        short = (wh_cfg.get('shortCode') or '').strip().upper()
        # Extract trailing digit sequence from rack name (supports non-padded historic names)
        m = re.search(r"(\d+)$", str(rack.name or ''))
        rack_seq = (str(int(m.group(1))) if m else '1').zfill(3)
        # Use 1-based indices for display codes
        s = str(int(stack_index) + 1).zfill(3)
        b = str(int(bin_index) + 1).zfill(3)
        core = f"{rack_prefix}{rack_seq}-S{s}-B{b}"
        return f"{short}-{core}" if short else core

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
