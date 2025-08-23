from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.api import deps
from app.models.user import User
from app.schemas.bay import Bay, BayCreate, BayUpdate, BayAssignRequest, BayKpis

router = APIRouter()

# In-memory store for now (aligns with frontend mock until DB model is added)
_BAYS: list[Bay] = []


def _seed():
    global _BAYS
    if _BAYS:
        return
    now = datetime.utcnow()
    # Minimal seed, rest managed via API
    _BAYS = [
        Bay(
            id="BAY-01",
            name="Gate A1",
            warehouse_id="WH-01",
            type="GOODS_IN",
            capacity=1,
            vehicleCompat=["SMALL", "MEDIUM"],
            status="EMPTY",
            created_at=(now).isoformat(),
            updated_at=(now).isoformat(),
            utilizationPct=30,
        )
    ]


@router.get("/bays", response_model=List[Bay])
def list_bays(
    warehouse_id: Optional[str] = Query(None),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    _seed()
    if warehouse_id:
        return [b for b in _BAYS if b.warehouse_id == warehouse_id]
    return list(_BAYS)


@router.post("/bays", response_model=Bay)
def create_bay(
    payload: BayCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    _seed()
    now = datetime.utcnow().isoformat()
    bay = Bay(**payload.model_dump(), created_at=now, updated_at=now, utilizationPct=0)
    _BAYS.append(bay)
    return bay


@router.put("/bays/{bay_id}", response_model=Bay)
def update_bay(
    bay_id: str,
    patch: BayUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    _seed()
    for i, b in enumerate(_BAYS):
        if b.id == bay_id:
            data = b.model_dump()
            data.update({k: v for k, v in patch.model_dump(exclude_unset=True).items()})
            data["updated_at"] = datetime.utcnow().isoformat()
            _BAYS[i] = Bay(**data)
            return _BAYS[i]
    raise HTTPException(status_code=404, detail="Bay not found")


@router.delete("/bays/{bay_id}", response_model=Bay)
def delete_bay(
    bay_id: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser),
):
    _seed()
    for i, b in enumerate(_BAYS):
        if b.id == bay_id:
            return _BAYS.pop(i)
    raise HTTPException(status_code=404, detail="Bay not found")


@router.post("/bays/{bay_id}/assign", response_model=Bay)
def assign_bay(
    bay_id: str,
    payload: BayAssignRequest,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    _seed()
    for i, b in enumerate(_BAYS):
        if b.id == bay_id:
            data = b.model_dump()
            data["status"] = "RESERVED"
            data["reserved_for"] = payload.model_dump(exclude_none=True)
            data["vehicle"] = payload.vehicle
            data["operation"] = payload.operation
            data["updated_at"] = datetime.utcnow().isoformat()
            _BAYS[i] = Bay(**data)
            return _BAYS[i]
    raise HTTPException(status_code=404, detail="Bay not found")


@router.post("/bays/{bay_id}/arrived", response_model=Bay)
def vehicle_arrived(
    bay_id: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    _seed()
    for i, b in enumerate(_BAYS):
        if b.id == bay_id:
            data = b.model_dump()
            data["status"] = "VEHICLE_PRESENT"
            data["progressPct"] = 0
            data["updated_at"] = datetime.utcnow().isoformat()
            _BAYS[i] = Bay(**data)
            return _BAYS[i]
    raise HTTPException(status_code=404, detail="Bay not found")


@router.post("/bays/{bay_id}/release", response_model=Bay)
def release_bay(
    bay_id: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    _seed()
    for i, b in enumerate(_BAYS):
        if b.id == bay_id:
            data = b.model_dump()
            data.update({
                "status": "EMPTY",
                "vehicle": None,
                "reserved_for": None,
                "operation": None,
                "progressPct": None,
                "updated_at": datetime.utcnow().isoformat(),
            })
            _BAYS[i] = Bay(**data)
            return _BAYS[i]
    raise HTTPException(status_code=404, detail="Bay not found")


@router.post("/bays/{bay_id}/toggle-maintenance", response_model=Bay)
def toggle_maintenance(
    bay_id: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    _seed()
    for i, b in enumerate(_BAYS):
        if b.id == bay_id:
            data = b.model_dump()
            data["status"] = "EMPTY" if b.status == "MAINTENANCE" else "MAINTENANCE"
            data["updated_at"] = datetime.utcnow().isoformat()
            _BAYS[i] = Bay(**data)
            return _BAYS[i]
    raise HTTPException(status_code=404, detail="Bay not found")

@router.post("/bays/{bay_id}/toggle-dynamic", response_model=Bay)
def toggle_dynamic_mode(
    bay_id: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """Flip dynamicMode between GOODS_IN and GOODS_OUT when type is DYNAMIC.

    If bay is not of type DYNAMIC, this is a no-op returning the current bay.
    """
    _seed()
    for i, b in enumerate(_BAYS):
        if b.id == bay_id:
            if b.type != "DYNAMIC":
                return b
            data = b.model_dump()
            prev = b.dynamicMode or "GOODS_IN"
            data["dynamicMode"] = "GOODS_OUT" if prev == "GOODS_IN" else "GOODS_IN"
            data["updated_at"] = datetime.utcnow().isoformat()
            _BAYS[i] = Bay(**data)
            return _BAYS[i]
    raise HTTPException(status_code=404, detail="Bay not found")


@router.get("/bays/kpis", response_model=BayKpis)
def compute_kpis(
    warehouse_id: Optional[str] = Query(None),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    _seed()
    scope = [b for b in _BAYS if not warehouse_id or b.warehouse_id == warehouse_id]
    total = len(scope)
    occupied = len([b for b in scope if b.status == "VEHICLE_PRESENT"])
    reserved = len([b for b in scope if b.status == "RESERVED"])
    maintenance = len([b for b in scope if b.status == "MAINTENANCE"])
    empty = len([b for b in scope if b.status == "EMPTY"])
    utilization = round(sum(b.utilizationPct or 0 for b in scope) / max(1, total))
    averageTurnaroundMin = 48
    idleRatePct = round((empty / max(1, total)) * 100)
    efficiencyPct = min(100, round(((occupied * 0.7 + reserved * 0.3) / max(1, total)) * 100))
    return BayKpis(
        total=total,
        occupied=occupied,
        reserved=reserved,
        maintenance=maintenance,
        empty=empty,
        utilization=utilization,
        averageTurnaroundMin=averageTurnaroundMin,
        idleRatePct=idleRatePct,
        efficiencyPct=efficiencyPct,
    )
