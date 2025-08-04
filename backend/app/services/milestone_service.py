# backend/app/services/milestone_service.py

from sqlalchemy.orm import Session
from app.crud.crud_milestone import milestone as crud_milestone
from app.schemas.milestone import MilestoneCreate
from app.models.milestone import MilestoneEventType, MilestoneEntityType

MILESTONE_VALUES = [1, 10, 100, 500, 1000, 10000, 100000, 1000000, 2500000, 5000000, 10000000]

def get_next_milestone(current_count: int) -> int | None:
    """
    Get the next milestone value based on the current count.
    """
    for value in MILESTONE_VALUES:
        if current_count < value:
            return value
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
):
    """
    Checks if a milestone is reached and creates a milestone record if it is.
    """
    last_milestone = (
        db.query(crud_milestone.model)
        .filter_by(event_type=event_type, entity_type=entity_type, related_entity_id=entity_id)  # Updated to use 'related_entity_id'
        .order_by(crud_milestone.model.milestone_value.desc())
        .first()
    )

    last_milestone_value = last_milestone.milestone_value if last_milestone else 0
    next_milestone_value = get_next_milestone(last_milestone_value)

    # Bypass milestone validation for specific events
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
        crud_milestone.create(db, obj_in=milestone_in)
        return

    if next_milestone_value and current_count >= next_milestone_value:
        milestone_in = MilestoneCreate(
            event_type=event_type,
            entity_type=entity_type,
            entity_id=str(entity_id),
            milestone_value=next_milestone_value,
            description=description,
            user_id=user_id,
            title=title,  # Pass the title to the milestone creation
            milestone_type=milestone_type,  # Pass milestone_type to the milestone creation
        )
        crud_milestone.create(db, obj_in=milestone_in)