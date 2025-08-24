from __future__ import annotations

import re
import uuid
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.crud import crud_rack
from app.crud.crud_config import config as cfg

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
