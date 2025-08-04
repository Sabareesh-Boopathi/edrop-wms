# backend/app/scripts/check_anniversaries.py

from datetime import date
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.warehouse import Warehouse
from app.services.milestone_service import check_and_create_milestone, MilestoneEventType, MilestoneEntityType

def check_warehouse_anniversaries(db: Session):
    today = date.today()
    warehouses = db.query(Warehouse).all()
    for warehouse in warehouses:
        if warehouse.created_at.month == today.month and warehouse.created_at.day == today.day:
            age = today.year - warehouse.created_at.year
            if age > 0:
                check_and_create_milestone(
                    db,
                    event_type=MilestoneEventType.WAREHOUSE_ANNIVERSARY,
                    entity_type=MilestoneEntityType.WAREHOUSE,
                    entity_id=str(warehouse.id),
                    current_count=age,
                    description=f"🏢 Happy {age}th Anniversary to Warehouse '{warehouse.name}'"
                )

if __name__ == "__main__":
    db = SessionLocal()
    check_warehouse_anniversaries(db)
    db.close()