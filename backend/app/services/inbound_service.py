import uuid
from datetime import datetime
from sqlalchemy.orm import Session, joinedload
from typing import Optional
from app.models.inbound_receipt import InboundReceipt
from app.models.inbound_receipt_line import InboundReceiptLine
from app.models.bin import Bin
from app.models.rack import Rack
import logging

log = logging.getLogger(__name__)

# Simple generator to produce a deterministic code based on index
_letters = ['A','B','C','D','E','F']

def _gen_bin_code(idx: int) -> str:
    letter = _letters[idx % len(_letters)]
    num = (idx % 9) + 1
    return f"BIN-{letter}{num}"


def auto_allocate_bins(db: Session, receipt_id: uuid.UUID) -> Optional[InboundReceipt]:
    rec = db.query(InboundReceipt).get(receipt_id)
    if not rec:
        log.warning("auto_allocate_bins: receipt not found id=%s", receipt_id)
        return None
    # Build candidate empty bins in same warehouse on active racks
    q = (
        db.query(Bin)
        .join(Rack, Bin.rack_id == Rack.id)
        .filter(Rack.warehouse_id == rec.warehouse_id)
        .filter(Rack.status == 'active')
        .filter(Bin.status == 'empty')
    )

    # Special rule for FLAT vendors: do not mix SKUs; allocate from racks dedicated to flat (no product bins)
    # Strategy: prefer racks where no bin has product_id set (either empty or reserved/occupied without product association).
    # Fallback to all empty bins if none match.
    if str(getattr(rec, 'vendor_type', '')).upper() == 'FLAT':
        # Get rack IDs that have any bin with a product_id (indicating SKU mixing)
        from sqlalchemy import distinct
        racks_with_product = (
            db.query(distinct(Bin.rack_id))
            .join(Rack, Bin.rack_id == Rack.id)
            .filter(Rack.warehouse_id == rec.warehouse_id)
            .filter(Bin.product_id.isnot(None))
            .subquery()
        )
        empty_bins = (
            q.filter(~Bin.rack_id.in_(db.query(racks_with_product.c.rack_id)))
             .order_by(Rack.name.asc(), Bin.stack_index.asc(), Bin.bin_index.asc())
             .all()
        )
        if not empty_bins:
            # Fallback: no clean racks; use generic empty bins
            empty_bins = (
                q.order_by(Rack.name.asc(), Bin.stack_index.asc(), Bin.bin_index.asc()).all()
            )
    else:
        empty_bins = (
            q.order_by(Rack.name.asc(), Bin.stack_index.asc(), Bin.bin_index.asc()).all()
        )
    log.info("auto_allocate_bins: candidate empty bins=%d for receipt=%s", len(empty_bins), receipt_id)
    idx = 0
    assigned = 0
    for line in rec.lines:
        if not line.bin_id:
            # Find next available empty bin
            while idx < len(empty_bins) and empty_bins[idx].status != 'empty':
                idx += 1
            if idx >= len(empty_bins):
                log.info("auto_allocate_bins: out of empty bins after assigning %d lines", assigned)
                break  # no more bins; leave remaining lines unassigned
            b = empty_bins[idx]
            line.bin_id = b.id
            # Mark bin reserved for inbound allocation and associate product/qty when available
            b.status = 'reserved'
            try:
                # For SKU mode, attach product; for FLAT keep product fields empty to avoid mixing policy
                if str(getattr(rec, 'vendor_type', '')).upper() != 'FLAT' and getattr(line, 'product_id', None):
                    b.product_id = line.product_id
                # Quantity reflects allocated quantity for this inbound line
                if getattr(line, 'quantity', None) is not None:
                    b.quantity = int(line.quantity)
            except Exception:
                # Best-effort; keep allocation even if enrichment fails
                pass
            log.debug("auto_allocate_bins: line=%s allocated to bin=%s code=%s", line.id, b.id, getattr(b, 'code', None))
            idx += 1
            db.add(line)
            db.add(b)
            assigned += 1
    rec.updated_at = datetime.utcnow()
    db.add(rec)
    db.commit()
    # If all lines have a bin now, progress receipt to READY_FOR_PICKING
    try:
        total = len(rec.lines or [])
        with_bins = sum(1 for l in rec.lines or [] if l.bin_id)
        if total > 0 and with_bins == total:
            rec.status = 'READY_FOR_PICKING'
            rec.updated_at = datetime.utcnow()
            db.add(rec)
            db.commit()
            log.info("auto_allocate_bins: all lines allocated; progressed receipt %s to READY_FOR_PICKING", receipt_id)
        else:
            log.info("auto_allocate_bins: partial allocation assigned=%d total=%d", with_bins, total)
    except Exception:
        log.exception("auto_allocate_bins: failed to evaluate/progress status for receipt %s", receipt_id)
    # Return with lines+bin eagerly loaded so bin_code serializes
    rec = (
        db.query(InboundReceipt)
        .options(joinedload(InboundReceipt.lines).joinedload(InboundReceiptLine.bin))
        .get(receipt_id)
    )
    return rec


def reassign_line_bin(db: Session, line_id: uuid.UUID) -> Optional[InboundReceiptLine]:
    line = db.query(InboundReceiptLine).get(line_id)
    if not line:
        log.warning("reassign_line_bin: line not found id=%s", line_id)
        return None
    # Find another empty bin in same warehouse
    rec = db.query(InboundReceipt).get(line.receipt_id)
    if not rec:
        log.warning("reassign_line_bin: parent receipt not found for line=%s", line_id)
        return None
    current_bin = None
    if line.bin_id:
        current_bin = db.query(Bin).get(line.bin_id)
        if current_bin:
            # Free previous bin and clear related product allocation fields
            current_bin.status = 'empty'
            try:
                current_bin.product_id = None
                current_bin.store_product_id = None
                current_bin.quantity = None
            except Exception:
                pass
            db.add(current_bin)
            log.debug("reassign_line_bin: freed previous bin=%s for line=%s", current_bin.id, line.id)
    new_bin = (
        db.query(Bin)
        .join(Rack, Bin.rack_id == Rack.id)
        .filter(Rack.warehouse_id == rec.warehouse_id)
        .filter(Rack.status == 'active')
        .filter(Bin.status == 'empty')
        .order_by(Rack.name.asc(), Bin.stack_index.asc(), Bin.bin_index.asc())
        .first()
    )
    if not new_bin:
        log.info("reassign_line_bin: no empty bins available in active racks for receipt=%s line=%s", rec.id, line_id)
        return line
    line.bin_id = new_bin.id
    new_bin.status = 'reserved'
    try:
        # Attach product/qty if available
        if getattr(line, 'product_id', None):
            new_bin.product_id = line.product_id
        if getattr(line, 'quantity', None) is not None:
            new_bin.quantity = int(line.quantity)
    except Exception:
        pass
    db.add(new_bin)
    db.add(line)
    db.commit()
    db.refresh(line)
    log.debug("reassign_line_bin: line=%s assigned to new bin=%s code=%s", line.id, new_bin.id, getattr(new_bin, 'code', None))
    return line


def clear_line_bin(db: Session, line_id: uuid.UUID) -> Optional[InboundReceiptLine]:
    line = db.query(InboundReceiptLine).get(line_id)
    if not line:
        log.warning("clear_line_bin: line not found id=%s", line_id)
        return None
    if line.bin_id:
        b = db.query(Bin).get(line.bin_id)
        if b:
            # Reset bin to empty and clear product allocation fields
            b.status = 'empty'
            try:
                b.product_id = None
                b.store_product_id = None
                b.quantity = None
            except Exception:
                pass
            db.add(b)
            log.debug("clear_line_bin: cleared bin=%s for line=%s", b.id, line.id)
    line.bin_id = None
    db.add(line)
    db.commit()
    db.refresh(line)
    return line
