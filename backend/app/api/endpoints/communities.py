# filepath: backend/app/api/endpoints/communities.py
from typing import List
import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api import deps
from app.crud import crud_community
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
