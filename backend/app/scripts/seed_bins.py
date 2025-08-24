"""
Seed racks and empty bins for a warehouse so auto-allocation can work.

Usage (inside backend container or venv):
  python -m app.scripts.seed_bins --warehouse-id <UUID> --racks 1 --stacks 3 --bins-per-stack 10

Prereqs:
  - WarehouseConfig must exist for the warehouse with a shortCode and rackPrefix configured
"""
from __future__ import annotations

import argparse
from typing import Optional
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.crud import crud_rack, crud_bin
from app.schemas.rack import RackCreateRequest
from app.schemas.bin import BinCreate
from app.services.bin_code import build_bin_code
from app import models


def seed_bins(
    db: Session,
    *,
    warehouse_id: str,
    racks: int = 1,
    stacks: int = 3,
    bins_per_stack: int = 10,
) -> None:
    # Ensure warehouse exists
    wh = db.query(models.Warehouse).get(warehouse_id)
    if not wh:
        raise SystemExit(f"Warehouse not found: {warehouse_id}")

    created_racks: list[models.Rack] = []
    for _ in range(max(1, int(racks))):
        r = crud_rack.rack.create(
            db,
            obj_in=RackCreateRequest(
                warehouse_id=wh.id,
                stacks=int(stacks),
                bins_per_stack=int(bins_per_stack),
                description="Seeded by seed_bins.py",
                status="active",
            ),
        )
        created_racks.append(r)

        # Create physical bin records grid
        for s in range(int(stacks)):
            for b in range(int(bins_per_stack)):
                code = build_bin_code(db, r.id, s, b)
                payload = BinCreate(
                    rack_id=r.id,
                    stack_index=s,
                    bin_index=b,
                    code=code,
                    status="empty",
                    crate_id=None,
                    product_id=None,
                    store_product_id=None,
                    quantity=0,
                )
                crud_bin.bin.create(db, obj_in=payload)

    print(
        f"Seeded {len(created_racks)} rack(s) with {stacks}x{bins_per_stack} empty bins each "
        f"for warehouse {wh.name} ({wh.id})."
    )


def main(argv: Optional[list[str]] = None) -> None:
    p = argparse.ArgumentParser(description="Seed racks and bins for a warehouse")
    p.add_argument("--warehouse-id", required=True, help="Warehouse UUID")
    p.add_argument("--racks", type=int, default=1)
    p.add_argument("--stacks", type=int, default=3)
    p.add_argument("--bins-per-stack", type=int, default=10)
    args = p.parse_args(argv)

    db = SessionLocal()
    try:
        seed_bins(
            db,
            warehouse_id=args["warehouse_id"] if isinstance(args, dict) else args.warehouse_id,
            racks=args["racks"] if isinstance(args, dict) else args.racks,
            stacks=args["stacks"] if isinstance(args, dict) else args.stacks,
            bins_per_stack=args["bins_per_stack"] if isinstance(args, dict) else args.bins_per_stack,
        )
    finally:
        db.close()


if __name__ == "__main__":
    main()
