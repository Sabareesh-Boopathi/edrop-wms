from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.api import deps
import logging

router = APIRouter()
logger = logging.getLogger("app.api.endpoints.milestone")

@router.get("/", response_model=list[schemas.Milestone])
def read_milestones(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
):
    """
    Retrieve milestones.
    """
    logger.info(f"ℹ️ Fetching milestones with skip={skip} and limit={limit}")
    milestones = crud.milestone.get_multi(db, skip=skip, limit=limit)
    logger.info(f"✅ Retrieved {len(milestones)} milestones")
    return milestones

@router.post("/", response_model=schemas.Milestone)
def create_milestone(
    *,
    db: Session = Depends(deps.get_db),
    milestone_in: schemas.MilestoneCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new milestone.
    """
    logger.info(f"ℹ️ Attempting to create a new milestone: {milestone_in}")
    if not crud.user.is_superuser(current_user):
        logger.warning(f"⚠️ Permission denied for user {current_user.id} to create milestone")
        raise HTTPException(status_code=403, detail="Not enough permissions")
    milestone = crud.milestone.create(db, obj_in=milestone_in)
    logger.info(f"✅ Milestone created successfully: {milestone}")
    return milestone
