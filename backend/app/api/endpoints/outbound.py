from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from app import models
from app.api import deps
from app.schemas.outbound import (
    PickTask, ToteLocation, PackingTote, RouteSummary, RouteBin as RouteBinSchema, DispatchRoute,
    ReassignPickPayload, SplitPickPayload, ReassignTotePayload, OverridePayload,
    ForceReassignPayload, AssignDriverPayload
)

router = APIRouter()

_now = lambda: datetime.utcnow().isoformat()

# Pick
@router.get('/outbound/pick-tasks', response_model=list[PickTask])
def fetch_pick_tasks(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
):
    # Build pick tasks from existing Orders and OrderProduct quantities
    q = db.query(models.Order)
    eff_wh = deps.get_effective_warehouse_id(current_user)
    if eff_wh:
        q = q.filter(models.Order.warehouse_id == eff_wh)
    orders = q.order_by(models.Order.created_at.desc()).limit(200).all()

    results: list[PickTask] = []
    for o in orders:
        try:
            sku_count = 0
            # Sum via relationship if loaded; fallback join otherwise
            if hasattr(o, 'items') and o.items is not None:
                sku_count = int(sum(int(getattr(it, 'quantity', 0) or 0) for it in o.items))
            else:
                sku_count = int(
                    db.query(func.coalesce(func.sum(models.OrderProduct.quantity), 0))
                    .filter(models.OrderProduct.order_id == o.id)
                    .scalar() or 0
                )
        except Exception:
            sku_count = 0
        # Map order status to pick status
        ost = str(getattr(o, 'status', 'pending') or 'pending').lower()
        if ost in {'completed', 'done', 'closed'}:
            pick_status = 'completed'
        elif ost in {'in_progress', 'picking'}:
            pick_status = 'in_progress'
        else:
            pick_status = 'pending'
        # Tote id not modeled: derive stable placeholder from order id prefix
        tote_id = f"TOTE-{str(o.id)[:8].upper()}"
        results.append(PickTask(
            id=str(o.id),
            tote_id=tote_id,
            order_id=str(o.id),
            sku_count=sku_count,
            picker=None,
            status=pick_status,  # type: ignore[arg-type]
            exceptions=None,
            updated_at=_now(),
        ))
    return results

@router.post('/outbound/pick-tasks/{task_id}/reassign')
def reassign_pick_task(task_id: str, payload: ReassignPickPayload, db: Session = Depends(deps.get_db), _=Depends(deps.ensure_not_viewer_for_write)):
    return {"ok": True}

@router.post('/outbound/pick-tasks/{task_id}/cancel')
def cancel_pick_task(task_id: str, db: Session = Depends(deps.get_db), _=Depends(deps.ensure_not_viewer_for_write)):
    return {"ok": True}

@router.post('/outbound/pick-tasks/{task_id}/split')
def split_pick_task(task_id: str, payload: SplitPickPayload, db: Session = Depends(deps.get_db), _=Depends(deps.ensure_not_viewer_for_write)):
    return {"ok": True}

@router.get('/outbound/totes/{tote_id}/location', response_model=ToteLocation)
def fetch_tote_location(tote_id: str, db: Session = Depends(deps.get_db)):
    # No tote tracking model yet; return a neutral location
    return ToteLocation(tote_id=tote_id, location='storage', last_seen_at=_now())

# Packing
@router.get('/outbound/packing-queue', response_model=list[PackingTote])
def fetch_packing_queue(db: Session = Depends(deps.get_db)):
    # TODO: Implement when packing models exist
    return []

@router.post('/outbound/packing/{tote_id}/send-back')
def send_back_to_picking(tote_id: str, db: Session = Depends(deps.get_db), _=Depends(deps.ensure_not_viewer_for_write)):
    return {"ok": True}

@router.post('/outbound/packing/{tote_id}/reassign')
def reassign_tote(tote_id: str, payload: ReassignTotePayload, db: Session = Depends(deps.get_db), _=Depends(deps.ensure_not_viewer_for_write)):
    return {"ok": True}

@router.post('/outbound/packing/{tote_id}/override')
def override_validation(tote_id: str, payload: OverridePayload, db: Session = Depends(deps.get_db), _=Depends(deps.ensure_not_viewer_for_write)):
    return {"ok": True}

# Route Binning
@router.get('/outbound/routes', response_model=list[RouteSummary])
def fetch_routes(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
):
    eff_wh = deps.get_effective_warehouse_id(current_user)
    q = db.query(models.Route)
    if eff_wh:
        q = q.filter(models.Route.warehouse_id == eff_wh)
    routes = q.order_by(models.Route.created_at.desc()).limit(100).all()

    result: list[RouteSummary] = []
    for r in routes:
        bins: list[RouteBinSchema] = []
        for b in (r.bins or []):
            totes = []
            for c in (b.crates or []):
                if getattr(c, 'qr_code', None):
                    totes.append(c.qr_code)
            bins.append(RouteBinSchema(bin_id=b.code, capacity=b.capacity or 0, totes=totes, locked=b.locked))
        result.append(RouteSummary(route_id=str(r.id), name=r.name, bins=bins, auto_slotting=bool(r.auto_slotting)))
    return result

@router.post('/outbound/binning/force-reassign')
def force_bin_reassign(payload: ForceReassignPayload, db: Session = Depends(deps.get_db), _=Depends(deps.ensure_not_viewer_for_write)):
    return {"ok": True}

@router.post('/outbound/routes/{route_id}/lock')
@router.post('/outbound/routes/{route_id}/unlock')
def toggle_route_lock(route_id: str, request: Request, db: Session = Depends(deps.get_db), _=Depends(deps.ensure_not_viewer_for_write)):
    route = db.query(models.Route).filter(models.Route.id == route_id).first()
    if not route:
        return {"ok": False}
    lock = 'lock' in request.url.path
    for b in route.bins or []:
        b.locked = lock
    db.commit()
    return {"ok": True}

@router.post('/outbound/routes/reoptimize')
def reoptimize_routes(db: Session = Depends(deps.get_db), _=Depends(deps.ensure_not_viewer_for_write)):
    return {"ok": True}

# Dispatch
@router.get('/outbound/dispatch/routes', response_model=list[DispatchRoute])
def fetch_dispatch_routes(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
):
    eff_wh = deps.get_effective_warehouse_id(current_user)
    q = db.query(models.Route)
    if eff_wh:
        q = q.filter(models.Route.warehouse_id == eff_wh)
    routes = q.order_by(models.Route.created_at.desc()).limit(100).all()

    result: list[DispatchRoute] = []
    for r in routes:
        totes_expected = 0
        for b in (r.bins or []):
            totes_expected += len(b.crates or [])
        logs = db.query(models.DispatchLoadingLog).filter(models.DispatchLoadingLog.route_id == r.id).order_by(models.DispatchLoadingLog.ts.asc()).all()
        loading_logs = [
            {
                'ts': (l.ts.isoformat() if hasattr(l.ts, 'isoformat') else str(l.ts)),
                'tote_id': (l.tote_code or (str(getattr(l.crate, 'qr_code', '')) if getattr(l, 'crate', None) else '')),
                'ok': bool(l.ok),
                'note': l.note or None,
            }
            for l in logs
        ]
        result.append(DispatchRoute(
            route_id=str(r.id),
            name=r.name,
            status=r.status,  # type: ignore[arg-type]
            driver=(r.driver.name if r.driver else None),
            vehicle=(r.vehicle.reg_no if r.vehicle else None),
            totes_loaded=len([l for l in loading_logs if l['ok']]),
            totes_expected=totes_expected,
            loading_logs=loading_logs,  # type: ignore[arg-type]
        ))
    return result

@router.post('/outbound/dispatch/{route_id}/assign-driver')
def assign_driver(route_id: str, payload: AssignDriverPayload, db: Session = Depends(deps.get_db), _=Depends(deps.ensure_not_viewer_for_write)):
    r = db.query(models.Route).filter(models.Route.id == route_id).first()
    if not r:
        return {"ok": False}
    if payload.driver:
        drv = db.query(models.Driver).filter(models.Driver.name == payload.driver).first()
        r.driver_id = drv.id if drv else None
    if payload.vehicle:
        veh = db.query(models.Vehicle).filter(models.Vehicle.reg_no == payload.vehicle).first()
        r.vehicle_id = veh.id if veh else None
    db.commit()
    return {"ok": True}

@router.post('/outbound/dispatch/{route_id}/approve')
@router.post('/outbound/dispatch/{route_id}/hold')
@router.post('/outbound/dispatch/{route_id}/cancel')
def update_dispatch(route_id: str, request: Request, db: Session = Depends(deps.get_db), _=Depends(deps.ensure_not_viewer_for_write)):
    r = db.query(models.Route).filter(models.Route.id == route_id).first()
    if not r:
        return {"ok": False}
    path = request.url.path
    if path.endswith('/approve'):
        r.status = 'ready'
    elif path.endswith('/hold'):
        r.status = 'hold'
    elif path.endswith('/cancel'):
        r.status = 'pending'
    db.commit()
    return {"ok": True}
