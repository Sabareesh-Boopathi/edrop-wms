from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import datetime, date
from sqlalchemy import func, or_, and_

from app.crud.base import CRUDBase
from app.models.inbound_receipt import InboundReceipt
from app.models.inbound_receipt_line import InboundReceiptLine
from app.schemas.inbound import ReceiptCreate, ReceiptUpdate, Receipt, ReceiptLineUpdate
from app.crud.crud_config import config as cfg

class CRUDInboundReceipt(CRUDBase[InboundReceipt, ReceiptCreate, ReceiptUpdate]):
    def create(self, db: Session, *, obj_in: ReceiptCreate) -> InboundReceipt:
        # Generate receipt code using per-warehouse prefix and sequence
        data, seq = cfg.consume_next_receipt_seq(db, str(obj_in.warehouse_id))
        prefix = (data.get('receiptPrefix') or 'RCPT').strip() or 'RCPT'
        short = (data.get('shortCode') or '').strip().upper()
        # Include short warehouse code if available: PREFIX-SHORT-000001
        code = f"{prefix}-{short}-{seq:06d}" if short else f"{prefix}-{seq:06d}"

        rec = InboundReceipt(
            code=code,
            warehouse_id=obj_in.warehouse_id,
            vendor_id=obj_in.vendor_id,
            vendor_type=obj_in.vendor_type,
            reference=obj_in.reference,
            planned_arrival=obj_in.planned_arrival,
            notes=obj_in.notes,
        )
        # Build child lines explicitly
        for l in (obj_in.lines or []):
            line = InboundReceiptLine(
                product_sku=l.product_sku,
                product_name=l.product_name,
                customer_name=l.customer_name,
                apartment=l.apartment,
                quantity=l.quantity,
                notes=l.notes,
            )
            rec.lines.append(line)
        db.add(rec)
        db.commit()
        db.refresh(rec)
        return rec
    def list(self, db: Session, *, warehouse_id: Optional[UUID] = None, vendor_type: Optional[str] = None, status: Optional[str] = None, search: Optional[str] = None, date_from: Optional[datetime] = None, date_to: Optional[datetime] = None) -> List[InboundReceipt]:
        q = db.query(InboundReceipt)
        if warehouse_id:
            q = q.filter(InboundReceipt.warehouse_id == warehouse_id)
        if vendor_type:
            q = q.filter(InboundReceipt.vendor_type == vendor_type)
        if status:
            q = q.filter(InboundReceipt.status == status)
        if search:
            s = f"%{search.lower()}%"
            q = q.filter(or_(func.lower(InboundReceipt.code).like(s), func.lower(InboundReceipt.reference).like(s)))
        if date_from:
            q = q.filter(InboundReceipt.created_at >= date_from)
        if date_to:
            q = q.filter(InboundReceipt.created_at <= date_to)
        return q.order_by(InboundReceipt.created_at.desc()).all()

    def update_status(self, db: Session, *, id: UUID, status: str) -> Optional[InboundReceipt]:
        obj = db.query(InboundReceipt).get(id)
        if not obj:
            return None
        obj.status = status
        obj.updated_at = datetime.utcnow()
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return obj

inbound_receipts = CRUDInboundReceipt(InboundReceipt)

class CRUDInboundLine(CRUDBase[InboundReceiptLine, ReceiptLineUpdate, ReceiptLineUpdate]):
    def set_bin(self, db: Session, *, id: UUID, bin_id: Optional[UUID]) -> Optional[InboundReceiptLine]:
        obj = db.query(InboundReceiptLine).get(id)
        if not obj:
            return None
        obj.bin_id = bin_id
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return obj

inbound_lines = CRUDInboundLine(InboundReceiptLine)
