import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from typing import Optional
from app.models.inbound_receipt import InboundReceipt
from app.models.inbound_receipt_line import InboundReceiptLine
from app.models.bin import Bin
from app.models.rack import Rack

# Simple generator to produce a deterministic code based on index
_letters = ['A','B','C','D','E','F']

def _gen_bin_code(idx: int) -> str:
    letter = _letters[idx % len(_letters)]
    num = (idx % 9) + 1
    return f"BIN-{letter}{num}"


def auto_allocate_bins(db: Session, receipt_id: uuid.UUID) -> Optional[InboundReceipt]:
    rec = db.query(InboundReceipt).get(receipt_id)
    if not rec:
        return None
    # Find empty bins in same warehouse via racks
    empty_bins = (
        db.query(Bin)
        .join(Rack, Bin.rack_id == Rack.id)
        .filter(Rack.warehouse_id == rec.warehouse_id)
        .filter(Bin.status == 'empty')
        .order_by(Rack.name.asc(), Bin.stack_index.asc(), Bin.bin_index.asc())
        .all()
    )
    idx = 0
    for line in rec.lines:
        if not line.bin_id:
            # Find next available empty bin
            while idx < len(empty_bins) and empty_bins[idx].status != 'empty':
                idx += 1
            if idx >= len(empty_bins):
                break  # no more bins; leave remaining lines unassigned
            b = empty_bins[idx]
            line.bin_id = b.id
            # Mark bin reserved/occupied as needed; use 'reserved' for inbound allocation phase
            b.status = 'reserved'
            idx += 1
            db.add(line)
            db.add(b)
    rec.updated_at = datetime.utcnow()
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return rec


def reassign_line_bin(db: Session, line_id: uuid.UUID) -> Optional[InboundReceiptLine]:
    line = db.query(InboundReceiptLine).get(line_id)
    if not line:
        return None
    # Find another empty bin in same warehouse
    rec = db.query(InboundReceipt).get(line.receipt_id)
    if not rec:
        return None
    current_bin = None
    if line.bin_id:
        current_bin = db.query(Bin).get(line.bin_id)
        if current_bin:
            current_bin.status = 'empty'
            db.add(current_bin)
    new_bin = (
        db.query(Bin)
        .join(Rack, Bin.rack_id == Rack.id)
        .filter(Rack.warehouse_id == rec.warehouse_id)
        .filter(Bin.status == 'empty')
        .order_by(Rack.name.asc(), Bin.stack_index.asc(), Bin.bin_index.asc())
        .first()
    )
    if not new_bin:
        return line
    line.bin_id = new_bin.id
    new_bin.status = 'reserved'
    db.add(new_bin)
    db.add(line)
    db.commit()
    db.refresh(line)
    return line


def clear_line_bin(db: Session, line_id: uuid.UUID) -> Optional[InboundReceiptLine]:
    line = db.query(InboundReceiptLine).get(line_id)
    if not line:
        return None
    if line.bin_id:
        b = db.query(Bin).get(line.bin_id)
        if b:
            b.status = 'empty'
            db.add(b)
    line.bin_id = None
    db.add(line)
    db.commit()
    db.refresh(line)
    return line
