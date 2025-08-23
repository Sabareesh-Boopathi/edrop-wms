# backend/app/services/milestone_service.py

from sqlalchemy.orm import Session
from app.crud.crud_milestone import milestone as crud_milestone
from app.schemas.milestone import MilestoneCreate
from app.models.milestone import MilestoneEventType, MilestoneEntityType
from app.models.warehouse import Warehouse
import logging
import uuid

logger = logging.getLogger(__name__)

MILESTONE_VALUES = [1, 10, 50, 100, 500, 750, 1000, 2500, 5000, 7500, 10000, 250000, 50000, 100000, 250000, 500000, 750000, 1000000, 2500000, 5000000, 10000000]

def get_next_milestone(current_count: int) -> int | None:
    """
    Get the next milestone value based on the current count.
    """
    for value in MILESTONE_VALUES:
        if current_count == value:  # Adjusted to check for equality only
            logger.info(f"Next milestone value determined: {value}")
            return value
    logger.info("No next milestone value found.")
    return None

def _as_valid_uuid(value: str | None) -> uuid.UUID | None:
    """Return a UUID if value is a valid UUID string; otherwise None.

    Prevents accidental queries like WHERE id = 'None'::UUID.
    """
    if not value:
        return None
    try:
        return uuid.UUID(str(value))
    except Exception:
        return None

def check_and_create_milestone(
    db: Session,
    *,
    event_type: MilestoneEventType,
    entity_type: MilestoneEntityType,
    entity_id: str,
    current_count: int,
    user_id: str | None = None,
    description: str | None = None,
    title: str | None = None,  # Added title parameter
    milestone_type: str | None = None,  # Added milestone_type parameter
    warehouse_id: str | None = None,  # Added warehouse_id parameter
):
    """
    Checks if a milestone is reached and creates a milestone record if it is.
    Assumes current_count is pre-calculated for the respective context (system or warehouse).
    """
    
    next_milestone_value = get_next_milestone(current_count)

    # Resolve warehouse context (name) if provided and valid
    wh_name: str | None = None
    wh_lookup_id = _as_valid_uuid(warehouse_id) or _as_valid_uuid(entity_id)
    if wh_lookup_id:
        try:
            # Prefer modern Session.get if available; fallback to query.get
            wh = getattr(db, "get", None)
            wh = wh(Warehouse, wh_lookup_id) if callable(wh) else db.query(Warehouse).get(wh_lookup_id)
            if wh:
                wh_name = wh.name
        except Exception:
            wh_name = None

    # Ensure warehouse creation milestones are tied to the warehouse entity for manager notifications
    if event_type == MilestoneEventType.WAREHOUSE_CREATED:
        milestone_in = MilestoneCreate(
            event_type=event_type,
            entity_type=MilestoneEntityType.WAREHOUSE,  # force warehouse entity type
            related_entity_id=str(entity_id),
            milestone_value=current_count,
            description=description or (f"🏗️ A new warehouse '{wh_name or 'Warehouse'}' has been added to the eco-system! 🏢"),
            title=title or (f"Warehouse created: {wh_name}" if wh_name else "Warehouse creation milestone"),
            milestone_type=milestone_type or "warehouse_creation",
            user_id=user_id,
        )
        logger.info(f"🎯 {milestone_in.description}")
        crud_milestone.create(db, obj_in=milestone_in)
        return

    if current_count == next_milestone_value:
        try:
            effective_entity_type = MilestoneEntityType.WAREHOUSE if warehouse_id else entity_type
            milestone_in = MilestoneCreate(
                event_type=event_type,
                entity_type=effective_entity_type,
                related_entity_id=str(warehouse_id) if warehouse_id else str(entity_id),
                milestone_value=next_milestone_value,
                description=description or (
                    f"🎉 {(wh_name + ' ') if wh_name else ''}milestone reached: {milestone_type or event_type} ⇒ {next_milestone_value}"
                ),
                user_id=user_id,
                title=title or (
                    f"{wh_name} Milestone" if wh_name else "Milestone"
                ),
                milestone_type=milestone_type or ("warehouse_" + str(event_type)) if warehouse_id else str(event_type),
            )
            crud_milestone.create(db, obj_in=milestone_in)
            logger.info(f"🎯 {milestone_in.description}")
        except Exception as e:
            context = "Warehouse" if warehouse_id else "System"
            logger.error(f"Failed to create {context}-level milestone: {e}")
            raise