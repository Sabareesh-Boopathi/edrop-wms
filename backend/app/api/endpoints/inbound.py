from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.api import deps
from app.crud.crud_inbound import inbound_receipts, inbound_lines
from app.schemas.inbound import Receipt, ReceiptCreate, ReceiptUpdate, ReceiptFilter, ReceiptLine, ReceiptLineUpdate, GoodsInKpis, AutoCreatePayload, AutoCreateBatchPayload
from app.services.inbound_service import auto_allocate_bins as svc_auto_allocate, reassign_line_bin as svc_reassign, clear_line_bin as svc_clear
from app.models.user import User
from datetime import datetime, date
import logging
from app.crud.crud_audit import audit as crud_audit
from app import models
from app.models.audit_log import AuditLog

router = APIRouter(prefix="/inbound", tags=["Inbound"])
logger = logging.getLogger("app.api.endpoints.inbound")

@router.get("/receipts", response_model=List[Receipt])
def list_receipts(
    warehouse_id: Optional[uuid.UUID] = Query(None),
    vendor_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    logger.info("ℹ️ Listing inbound receipts warehouse=%s vendor_type=%s status=%s search=%s", warehouse_id, vendor_type, status, search)
    return inbound_receipts.list(db, warehouse_id=warehouse_id, vendor_type=vendor_type, status=status, search=search, date_from=date_from, date_to=date_to)

@router.post("/receipts", response_model=Receipt)
def create_receipt(
    payload: ReceiptCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    logger.info("📝 Creating inbound receipt by user=%s vendor=%s warehouse=%s", current_user.id, payload.vendor_id, payload.warehouse_id)
    obj = inbound_receipts.create(db, obj_in=payload)
    # Audit
    try:
        db.add(AuditLog(
            actor_user_id=current_user.id,
            entity_type="inbound_receipt",
            entity_id=str(obj.id),
            action="create",
            changes={
                "code": {"before": None, "after": obj.code},
                "vendor_id": {"before": None, "after": str(obj.vendor_id)},
                "vendor_type": {"before": None, "after": str(obj.vendor_type)},
                "warehouse_id": {"before": None, "after": str(obj.warehouse_id)},
                "line_count": {"before": None, "after": len(obj.lines)},
            }
        ))
        db.commit()
    except Exception:
        logger.exception("Failed to write audit log for inbound receipt create")
    return obj

@router.get("/receipts/{receipt_id}", response_model=Receipt)
def get_receipt(
    receipt_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    obj = inbound_receipts.get(db, id=receipt_id)
    if not obj:
        logger.warning("❌ Inbound receipt not found: %s", receipt_id)
        raise HTTPException(status_code=404, detail="Receipt not found")
    return obj

@router.post("/receipts:auto-create", response_model=Receipt)
def auto_create_receipt(
    payload: AutoCreatePayload,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Create a receipt by grouping pending customer orders for a given vendor into a single inbound.
    Groups by store mapped to this warehouse. Minimal heuristic: include all pending orders where
    product.vendor_id == vendor_id and order.warehouse_id == warehouse_id.
    """
    # Fetch pending orders and flatten to lines
    orders = (
        db.query(models.Order)
        .filter(models.Order.status == "pending", models.Order.warehouse_id == payload.warehouse_id)
        .all()
    )
    if not orders:
        raise HTTPException(status_code=404, detail="No pending demands found")

    # Build lines from order items for this vendor
    lines = []
    for o in orders:
        for it in (o.items or []):
            prod = it.product
            if not prod or str(prod.vendor_id) != str(payload.vendor_id):
                continue
            lines.append({
                "product_sku": prod.sku,
                "product_name": prod.name,
                "customer_name": getattr(o.customer, "name", None),
                "quantity": int(it.quantity or 1),
            })

    if not lines:
        raise HTTPException(status_code=404, detail="No pending demands for this vendor")

    # Create receipt
    rec_in = ReceiptCreate(
        vendor_id=payload.vendor_id,
        vendor_type="SKU",
        warehouse_id=payload.warehouse_id,
        reference=None,
        planned_arrival=datetime.utcnow(),
        notes="Auto-created from pending orders",
        lines=[{**l, "received_qty": None} for l in lines],
    )
    rec = inbound_receipts.create(db, obj_in=rec_in)

    # Mark orders as attached (lightweight status update)
    for o in orders:
        if o.status == "pending":
            o.status = "attached"
            db.add(o)
    db.commit()

    # Emit audit + placeholder tasks through audit log (until task tables exist)
    try:
        db.add(AuditLog(
            actor_user_id=current_user.id,
            entity_type="inbound_receipt",
            entity_id=str(rec.id),
            action="create_unloading_task",
            changes={"queue": {"before": None, "after": "UNLOADER"}}
        ))
        db.commit()
    except Exception:
        logger.exception("Failed to audit unloading task creation")
    return rec

@router.post("/receipts:auto-create-batch", response_model=List[Receipt])
def auto_create_receipts_batch(
    payload: AutoCreateBatchPayload,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    # Get distinct vendor_ids from pending orders in this warehouse
    orders = (
        db.query(models.Order)
        .filter(models.Order.status == "pending", models.Order.warehouse_id == payload.warehouse_id)
        .all()
    )
    vendor_ids = set()
    for o in orders:
        for it in (o.items or []):
            if it.product and it.product.vendor_id:
                vendor_ids.add(str(it.product.vendor_id))
    receipts: List[Receipt] = []
    for vid in vendor_ids:
        try:
            tmp = AutoCreatePayload(vendor_id=uuid.UUID(vid), warehouse_id=payload.warehouse_id)
            r = auto_create_receipt(tmp, db, current_user)  # reuse handler
            receipts.append(r)
        except HTTPException:
            continue
    return receipts

@router.put("/receipts/{receipt_id}", response_model=Receipt)
def update_receipt(
    receipt_id: uuid.UUID,
    payload: ReceiptUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    obj = inbound_receipts.get(db, id=receipt_id)
    if not obj:
        logger.warning("❌ Inbound receipt not found for update: %s", receipt_id)
        raise HTTPException(status_code=404, detail="Receipt not found")
    logger.info("ℹ️ Updating inbound receipt %s by user=%s", receipt_id, current_user.id)
    before_status = obj.status
    obj = inbound_receipts.update(db, db_obj=obj, obj_in=payload)
    logger.info("✅ Updated inbound receipt %s", receipt_id)
    # Audit status changes (and key fields if extended later)
    try:
        if payload.status is not None and before_status != payload.status:
            db.add(AuditLog(
                actor_user_id=current_user.id,
                entity_type="inbound_receipt",
                entity_id=str(receipt_id),
                action="update",
                changes={
                    "status": {"before": before_status, "after": payload.status}
                }
            ))
            db.commit()
    except Exception:
        logger.exception("Failed to write audit log for inbound receipt update")
    return obj

@router.patch("/lines/{line_id}", response_model=ReceiptLine)
def update_line(
    line_id: uuid.UUID,
    payload: ReceiptLineUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    obj = inbound_lines.get(db, id=line_id)
    if not obj:
        logger.warning("❌ Inbound receipt line not found: %s", line_id)
        raise HTTPException(status_code=404, detail="Line not found")
    logger.info("ℹ️ Updating inbound receipt line %s by user=%s", line_id, current_user.id)
    obj = inbound_lines.update(db, db_obj=obj, obj_in=payload)
    logger.info("✅ Updated inbound receipt line %s", line_id)
    return obj

# Simple KPIs to mirror frontend expectations
@router.get("/kpis", response_model=GoodsInKpis)
def kpis(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    from sqlalchemy import func
    from app.models.inbound_receipt import InboundReceipt
    today = datetime.utcnow().date()
    total = db.query(func.count(InboundReceipt.id)).scalar() or 0
    open_cnt = db.query(func.count(InboundReceipt.id)).filter(~InboundReceipt.status.in_(["COMPLETED","CANCELLED"])) .scalar() or 0
    pending = db.query(func.count(InboundReceipt.id)).filter(InboundReceipt.status=="AWAITING_UNLOADING").scalar() or 0
    completed_today = db.query(func.count(InboundReceipt.id)).filter(InboundReceipt.status=="COMPLETED", func.date(InboundReceipt.updated_at)==today).scalar() or 0
    # planned arrival earlier than today and still not completed/cancelled
    late = db.query(func.count(InboundReceipt.id)).filter(
        InboundReceipt.planned_arrival.isnot(None),
        func.date(InboundReceipt.planned_arrival) < today,
        ~InboundReceipt.status.in_(["COMPLETED","CANCELLED"])
    ).scalar() or 0
    sku_cnt = db.query(func.count(InboundReceipt.id)).filter(InboundReceipt.vendor_type=="SKU").scalar() or 0
    flat_cnt = db.query(func.count(InboundReceipt.id)).filter(InboundReceipt.vendor_type=="FLAT").scalar() or 0
    bins_alloc = db.query(func.count(InboundReceipt.id)).filter(InboundReceipt.status=="ALLOCATED").scalar() or 0
    logger.info("📈 Computing inbound KPIs by user=%s", current_user.id)
    return {
        "totalReceipts": total,
        "openReceipts": open_cnt,
        "pending": pending,
        "completedToday": completed_today,
        "lateArrivals": late,
        "skuReceipts": sku_cnt,
        "flatReceipts": flat_cnt,
        "binsAllocated": bins_alloc,
    }

@router.post("/receipts/{receipt_id}/auto-allocate", response_model=Receipt)
def auto_allocate(
    receipt_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    logger.info("🧰 Auto-allocating bins for receipt %s by user=%s", receipt_id, current_user.id)
    obj = svc_auto_allocate(db, receipt_id)
    if not obj:
        logger.warning("❌ Inbound receipt not found for auto-allocate: %s", receipt_id)
        raise HTTPException(status_code=404, detail="Receipt not found")
    logger.info("✅ Auto-allocated bins for receipt %s", receipt_id)
    try:
        assigned = sum(1 for l in (obj.lines or []) if l.bin_id)
        db.add(AuditLog(
            actor_user_id=current_user.id,
            entity_type="inbound_receipt",
            entity_id=str(receipt_id),
            action="auto_allocate",
            changes={"assigned_bins": {"before": None, "after": assigned}}
        ))
        db.commit()
    except Exception:
        logger.exception("Failed to write audit log for auto-allocate")
    return obj

@router.post("/lines/{line_id}/reassign", response_model=ReceiptLine)
def reassign_line(
    line_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    logger.info("🧰 Reassigning bin for line %s by user=%s", line_id, current_user.id)
    obj = svc_reassign(db, line_id)
    if not obj:
        logger.warning("❌ Inbound line not found for reassign: %s", line_id)
        raise HTTPException(status_code=404, detail="Line not found")
    logger.info("✅ Reassigned bin for line %s", line_id)
    try:
        db.add(AuditLog(
            actor_user_id=current_user.id,
            entity_type="inbound_line",
            entity_id=str(line_id),
            action="reassign_bin",
            changes={"bin_id": {"before": None, "after": str(obj.bin_id) if obj.bin_id else None}}
        ))
        db.commit()
    except Exception:
        logger.exception("Failed to write audit log for line reassign")
    return obj

@router.post("/lines/{line_id}/clear", response_model=ReceiptLine)
def clear_line(
    line_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    logger.info("🧰 Clearing bin for line %s by user=%s", line_id, current_user.id)
    obj = svc_clear(db, line_id)
    if not obj:
        logger.warning("❌ Inbound line not found for clear: %s", line_id)
        raise HTTPException(status_code=404, detail="Line not found")
    logger.info("✅ Cleared bin for line %s", line_id)
    try:
        db.add(AuditLog(
            actor_user_id=current_user.id,
            entity_type="inbound_line",
            entity_id=str(line_id),
            action="clear_bin",
            changes={"bin_id": {"before": None, "after": None}}
        ))
        db.commit()
    except Exception:
        logger.exception("Failed to write audit log for line clear")
    return obj
