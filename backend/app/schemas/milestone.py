"""
Pydantic schemas for Milestone model.
"""
import uuid
from datetime import datetime
from pydantic import BaseModel

from app.models.milestone import MilestoneEventType, MilestoneEntityType


# Shared properties
class MilestoneBase(BaseModel):
    event_type: MilestoneEventType
    entity_type: MilestoneEntityType | None
    related_entity_id: str | None = None  # Optional field with default value
    milestone_value: int
    description: str | None
    title: str = "Default Milestone Title"  # Default title
    milestone_type: str = "default"  # Default milestone type


# Properties to receive on item creation
class MilestoneCreate(MilestoneBase):
    user_id: uuid.UUID | None


# Properties to receive on item update
class MilestoneUpdate(MilestoneBase):
    pass


# Properties shared by models stored in DB
class MilestoneInDBBase(MilestoneBase):
    id: uuid.UUID
    timestamp: datetime
    auto_triggered: bool
    user_id: uuid.UUID | None

    class Config:
        orm_mode = True
        from_attributes = True


# Properties to return to client
class Milestone(MilestoneInDBBase):
    pass


# Properties properties stored in DB
class MilestoneInDB(MilestoneInDBBase):
    pass
