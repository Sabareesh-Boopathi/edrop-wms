# filepath: backend/app/api/endpoints/rwas.py
from typing import List
import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api import deps
from app.crud import crud_rwa
from app.models.user import User
from app.schemas.rwa import RWA, RWACreate, RWAUpdate

router = APIRouter()
logger = logging.getLogger("app.api.endpoints.rwas")

@router.get("/", response_model=List[RWA])
def read_rwas(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Retrieve all RWAs.
    """
    logger.info(f"ℹ️ User '{current_user.id}' listing all RWAs.")
    rwas = crud_rwa.rwa.get_multi(db, skip=skip, limit=limit)
    return rwas

@router.post("/", response_model=RWA)
def create_rwa(
    rwa_in: RWACreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Create a new RWA.
    """
    logger.info(f"ℹ️ User '{current_user.id}' attempting to create RWA: {rwa_in.name}")
    new_rwa = crud_rwa.rwa.create(db, obj_in=rwa_in)
    logger.info(f"✅ RWA '{new_rwa.id}' created successfully by user '{current_user.id}'.")
    return new_rwa

@router.get("/{rwa_id}", response_model=RWA)
def read_rwa(
    rwa_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Get a specific RWA by its ID.
    """
    logger.info(f"ℹ️ User '{current_user.id}' requesting RWA '{rwa_id}'.")
    db_rwa = crud_rwa.rwa.get(db, id=rwa_id)
    if db_rwa is None:
        logger.warning(f"❌ RWA '{rwa_id}' not found for request from user '{current_user.id}'.")
        raise HTTPException(status_code=404, detail="RWA not found")
    return db_rwa

@router.put("/{rwa_id}", response_model=RWA)
def update_rwa(
    rwa_id: uuid.UUID,
    rwa_in: RWAUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Update an RWA.
    """
    logger.info(f"ℹ️ User '{current_user.id}' attempting to update RWA '{rwa_id}'.")
    db_rwa = crud_rwa.rwa.get(db, id=rwa_id)
    if db_rwa is None:
        logger.warning(f"❌ RWA '{rwa_id}' not found for update attempt by user '{current_user.id}'.")
        raise HTTPException(status_code=404, detail="RWA not found")
    updated_rwa = crud_rwa.rwa.update(db, db_obj=db_rwa, obj_in=rwa_in)
    logger.info(f"✅ RWA '{updated_rwa.id}' updated successfully by user '{current_user.id}'.")
    return updated_rwa

@router.delete("/{rwa_id}", response_model=RWA)
def delete_rwa(
    rwa_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser), # Admin only
):
    """
    Delete an RWA.
    """
    logger.info(f"ℹ️ Admin '{current_user.id}' attempting to delete RWA '{rwa_id}'.")
    db_rwa = crud_rwa.rwa.get(db, id=rwa_id)
    if db_rwa is None:
        logger.warning(f"❌ RWA '{rwa_id}' not found for deletion attempt by admin '{current_user.id}'.")
        raise HTTPException(status_code=404, detail="RWA not found")
    deleted_rwa = crud_rwa.rwa.remove(db, id=rwa_id)
    logger.info(f"✅ RWA '{deleted_rwa.id}' deleted successfully by admin '{current_user.id}'.")
    return deleted_rwa