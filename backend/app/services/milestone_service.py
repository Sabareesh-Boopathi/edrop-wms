# backend/app/services/milestone_service.py

from sqlalchemy.orm import Session
from app.crud.crud_milestone import milestone as crud_milestone
from app.schemas.milestone import MilestoneCreate
from app.models.milestone import MilestoneEventType, MilestoneEntityType
import logging

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

    if event_type == MilestoneEventType.WAREHOUSE_CREATED:
        milestone_in = MilestoneCreate(
            event_type=event_type,
            entity_type=entity_type,
            related_entity_id=str(entity_id),
            milestone_value=current_count,  # Directly use the current count as the milestone value
            description=description,
            title=title,  # Pass the title to the milestone creation
            milestone_type=milestone_type,  # Pass milestone_type to the milestone creation
            user_id=user_id,
        )
        logger.info(f"🎯 {description}]")
        crud_milestone.create(db, obj_in=milestone_in)
        return
    
    if current_count == next_milestone_value:
        try:
            milestone_in = MilestoneCreate(
                event_type=event_type,
                entity_type=entity_type,
                entity_id=str(warehouse_id) if warehouse_id else str(entity_id),
                milestone_value=next_milestone_value,
                description=description,
                user_id=user_id,
                title=title,
                milestone_type=milestone_type,
            )
            crud_milestone.create(db, obj_in=milestone_in)
            logger.info(f"🎯 {description}]")
        except Exception as e:
            context = "Warehouse" if warehouse_id else "System"
            logger.error(f"Failed to create {context}-level milestone: {e}")
            raise