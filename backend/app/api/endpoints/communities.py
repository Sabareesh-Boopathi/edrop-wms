# filepath: backend/app/api/endpoints/communities.py
from typing import List
import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api import deps
from app.crud import crud_community
from app import crud, schemas, models
from app.models.milestone import MilestoneEntityType
from app.models.user import User
from app.schemas.community import Community, CommunityCreate, CommunityUpdate

router = APIRouter()
logger = logging.getLogger("app.api.endpoints.communities")

@router.get("/", response_model=List[Community])
@router.get("", response_model=List[Community])
def read_communities(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    warehouse_id: uuid.UUID | None = None,
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Retrieve all communities.
    """
    logger.info(f"ℹ️ User '{current_user.id}' listing all communities.")
    communities = crud_community.community.get_multi_by_warehouse(db, warehouse_id=warehouse_id, skip=skip, limit=limit)
    return communities

@router.post("/", response_model=Community)
@router.post("", response_model=Community)
def create_community(
    community_in: CommunityCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Create a new community.
    """
    logger.info(f"ℹ️ User '{current_user.id}' attempting to create community: {community_in.name}")
    new_community = crud_community.community.create(db, obj_in=community_in)
    logger.info(f"✅ Community '{new_community.id}' created successfully by user '{current_user.id}'.")
    return new_community

@router.get("/{community_id}", response_model=Community)
def read_community(
    community_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Get a specific community by its ID.
    """
    logger.info(f"ℹ️ User '{current_user.id}' requesting community '{community_id}'.")
    db_community = crud_community.community.get(db, id=community_id)
    if db_community is None:
        logger.warning(f"❌ Community '{community_id}' not found for request from user '{current_user.id}'.")
        raise HTTPException(status_code=404, detail="Community not found")
    return db_community

@router.put("/{community_id}", response_model=Community)
def update_community(
    community_id: uuid.UUID,
    community_in: CommunityUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Update a community.
    """
    logger.info(f"ℹ️ User '{current_user.id}' attempting to update community '{community_id}'.")
    db_community = crud_community.community.get(db, id=community_id)
    if db_community is None:
        logger.warning(f"❌ Community '{community_id}' not found for update attempt by user '{current_user.id}'.")
        raise HTTPException(status_code=404, detail="Community not found")
    updated_community = crud_community.community.update(db, db_obj=db_community, obj_in=community_in)
    logger.info(f"✅ Community '{updated_community.id}' updated successfully by user '{current_user.id}'.")
    return updated_community

@router.delete("/{community_id}", response_model=Community)
def delete_community(
    community_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser), # Admin only
):
    """
    Delete a community.
    """
    logger.info(f"ℹ️ Admin '{current_user.id}' attempting to delete community '{community_id}'.")
    db_community = crud_community.community.get(db, id=community_id)
    if db_community is None:
        logger.warning(f"❌ Community '{community_id}' not found for deletion attempt by admin '{current_user.id}'.")
        raise HTTPException(status_code=404, detail="Community not found")
    deleted_community = crud_community.community.remove(db, id=community_id)
    logger.info(f"✅ Community '{deleted_community.id}' deleted successfully by admin '{current_user.id}'.")
    return deleted_community


# --- Nested: Community Milestones ---
@router.get("/{community_id}/milestones", response_model=list[schemas.Milestone])
def list_community_milestones(
    community_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
):
    # Ensure community exists
    if not crud_community.community.get(db, id=community_id):
        raise HTTPException(status_code=404, detail="Community not found")
    return crud.milestone.get_all_by_related(
        db,
        related_entity_type="community",
        related_entity_id=str(community_id),
        skip=skip,
        limit=limit,
    )


@router.post("/{community_id}/milestones", response_model=schemas.Milestone)
def create_community_milestone(
    community_id: uuid.UUID,
    payload: schemas.MilestoneCreate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
):
    if not crud_community.community.get(db, id=community_id):
        raise HTTPException(status_code=404, detail="Community not found")
    # Force association to this community
    data = payload.copy(update={
        "related_entity_id": str(community_id),
        "milestone_type": payload.milestone_type or "community",
    })
    m = crud.milestone.create(db, obj_in=data)
    # Mark association type for disambiguation
    m = crud.milestone.update(db, db_obj=m, obj_in={"related_entity_type": "community"})
    return m


@router.put("/{community_id}/milestones/{milestone_id}", response_model=schemas.Milestone)
def update_community_milestone(
    community_id: uuid.UUID,
    milestone_id: uuid.UUID,
    payload: schemas.MilestoneUpdate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
):
    if not crud_community.community.get(db, id=community_id):
        raise HTTPException(status_code=404, detail="Community not found")
    m = crud.milestone.get(db, id=milestone_id)
    if not m or not crud.milestone.belongs_to_related(
        db, milestone_id=str(milestone_id), related_entity_type="community", related_entity_id=str(community_id)
    ):
        raise HTTPException(status_code=404, detail="Milestone not found for this community")
    return crud.milestone.update(db, db_obj=m, obj_in=payload)


@router.delete("/{community_id}/milestones/{milestone_id}", response_model=schemas.Milestone)
def delete_community_milestone(
    community_id: uuid.UUID,
    milestone_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_superuser),
):
    if not crud_community.community.get(db, id=community_id):
        raise HTTPException(status_code=404, detail="Community not found")
    m = crud.milestone.get(db, id=milestone_id)
    if not m or not crud.milestone.belongs_to_related(
        db, milestone_id=str(milestone_id), related_entity_type="community", related_entity_id=str(community_id)
    ):
        raise HTTPException(status_code=404, detail="Milestone not found for this community")
    return crud.milestone.remove(db, id=milestone_id)
