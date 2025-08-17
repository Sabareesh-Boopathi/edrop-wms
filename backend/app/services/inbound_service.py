import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from typing import Optional
from app.models.inbound_receipt import InboundReceipt
from app.models.inbound_receipt_line import InboundReceiptLine
from app.models.bin import Bin

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
    seq = 0
    for line in rec.lines:
        if not line.bin_id:
            # Find any empty bin in the same warehouse if desired; for now, generate code-only placeholder bin
            # In real implementation, select from Bin table by warehouse via rack->warehouse
            dummy_code = _gen_bin_code(seq)
            # Try to reuse an existing bin with code or create a detached code placeholder by leaving bin_id null and storing code in notes
            # For simplicity, create a new Bin with no rack association is not valid; we will leave bin_id null here and use notes
            line.notes = (line.notes or '') + f" [AUTO:{dummy_code}]"
            seq += 1
    rec.updated_at = datetime.utcnow()
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return rec


def reassign_line_bin(db: Session, line_id: uuid.UUID) -> Optional[InboundReceiptLine]:
    line = db.query(InboundReceiptLine).get(line_id)
    if not line:
        return None
    # As placeholder, just flip notes code
    now_idx = int(datetime.utcnow().timestamp()) % 100
    code = _gen_bin_code(now_idx)
    line.notes = (line.notes or '').split(' [AUTO:')[0] + f" [AUTO:{code}]"
    db.add(line)
    db.commit()
    db.refresh(line)
    return line


def clear_line_bin(db: Session, line_id: uuid.UUID) -> Optional[InboundReceiptLine]:
    line = db.query(InboundReceiptLine).get(line_id)
    if not line:
        return None
    line.bin_id = None
    if line.notes:
        line.notes = line.notes.split(' [AUTO:')[0].strip()
    db.add(line)
    db.commit()
    db.refresh(line)
    return line
