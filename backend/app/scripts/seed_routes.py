# Minimal seed for routes/bins using existing crates and current warehouses
from datetime import datetime
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app import models


def seed(db: Session):
    # Pick first warehouse
    wh = db.query(models.Warehouse).order_by(models.Warehouse.created_at.asc()).first()
    if not wh:
        print("No warehouses found; aborting seed.")
        return

    # If a route already exists, skip
    existing = db.query(models.Route).filter(models.Route.warehouse_id == wh.id).first()
    if existing:
        print("Route already exists; skipping seed.")
        return

    route = models.Route(name="Default Route", warehouse_id=wh.id, status="pending", auto_slotting=True)
    # Create two logical bins
    bin_a = models.RouteBin(code="A1", capacity=50, locked=False)
    bin_b = models.RouteBin(code="A2", capacity=50, locked=False)
    route.bins = [bin_a, bin_b]

    # Attach up to 10 crates across bins as starting totes
    crates = db.query(models.Crate).filter((models.Crate.warehouse_id == wh.id) | (models.Crate.warehouse_id.is_(None))).limit(10).all()
    for i, c in enumerate(crates):
        (bin_a if i % 2 == 0 else bin_b).crates.append(c)

    db.add(route)
    db.commit()
    print(f"Seeded route {route.name} with {len(crates)} crates across 2 bins for warehouse {wh.name}.")


if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed(db)
    finally:
        db.close()
