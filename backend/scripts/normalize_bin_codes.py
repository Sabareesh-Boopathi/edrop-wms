"""Normalize existing bin.code values to enforce 3‑digit zero padding (SXXX-BXXX)
while preserving any rack/warehouse prefix before the first 'S'.

Usage (inside backend container / venv):
  python -m scripts.normalize_bin_codes
"""
from __future__ import annotations
import re
from typing import Optional
from app.db.session import SessionLocal
from app.models.bin import Bin

def build_normalized(code: Optional[str], stack_index: int, bin_index: int) -> str:
    prefix = ''
    if code:
        m = re.match(r'^(.*?-)S\d+-B\d+$', code)
        if m:
            prefix = m.group(1)
    return f"{prefix}S{stack_index+1:03d}-B{bin_index+1:03d}"

def main() -> None:
    db = SessionLocal()
    updated = 0
    scanned = 0
    try:
        bins = db.query(Bin).all()
        for b in bins:
            scanned += 1
            target = build_normalized(b.code, b.stack_index, b.bin_index)
            if b.code != target:
                b.code = target
                updated += 1
        if updated:
            db.commit()
        print(f"Scanned {scanned} bins; updated {updated} codes to normalized format.")
    except Exception as e:  # noqa: BLE001
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":  # pragma: no cover
    main()
