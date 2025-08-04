"""
CRUD operations for Milestone model.
"""
from .base import CRUDBase
from app.models.milestone import Milestone
from app.schemas.milestone import MilestoneCreate, MilestoneUpdate


class CRUDMilestone(CRUDBase[Milestone, MilestoneCreate, MilestoneUpdate]):
    pass


milestone = CRUDMilestone(Milestone)
