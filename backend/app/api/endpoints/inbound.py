from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.api import deps
from app.crud.crud_inbound import inbound_receipts, inbound_lines
from app.schemas.inbound import Receipt, ReceiptCreate, ReceiptUpdate, ReceiptFilter, ReceiptLine, ReceiptLineUpdate, GoodsInKpis
from app.services.inbound_service import auto_allocate_bins as svc_auto_allocate, reassign_line_bin as svc_reassign, clear_line_bin as svc_clear
from app.models.user import User
from datetime import datetime, date
import logging
from app.crud.crud_audit import audit as crud_audit

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
        crud_audit.list_recent(db, 1)  # touch to ensure table exists; use a specific create API if available
    except Exception:
        pass
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
    obj = inbound_receipts.update(db, db_obj=obj, obj_in=payload)
    logger.info("✅ Updated inbound receipt %s", receipt_id)
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
    return obj
