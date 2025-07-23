from typing import List
import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.crud import crud_flat
from app.models.user import User
from app.schemas.flat import Flat, FlatCreate, FlatUpdate

router = APIRouter()
logger = logging.getLogger("app.api.endpoints.flats")

@router.get("/", response_model=List[Flat])
def read_flats(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
):
    logger.info(f"ℹ️ User '{current_user.id}' listing all flats.")
    return crud_flat.flat.get_multi(db, skip=skip, limit=limit)

@router.post("/", response_model=Flat)
def create_flat(
    flat_in: FlatCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    logger.info(f"ℹ️ User '{current_user.id}' attempting to create flat: {flat_in.flat_number}")
    new_flat = crud_flat.flat.create(db, obj_in=flat_in)
    logger.info(f"✅ Flat '{new_flat.id}' created successfully by user '{current_user.id}'.")
    return new_flat

@router.get("/{flat_id}", response_model=Flat)
def read_flat(
    flat_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    logger.info(f"ℹ️ User '{current_user.id}' requesting flat '{flat_id}'.")
    db_flat = crud_flat.flat.get(db, id=flat_id)
    if db_flat is None:
        logger.warning(f"❌ Flat '{flat_id}' not found for request from user '{current_user.id}'.")
        raise HTTPException(status_code=404, detail="Flat not found")
    return db_flat

@router.put("/{flat_id}", response_model=Flat)
def update_flat(
    flat_id: uuid.UUID,
    flat_in: FlatUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    logger.info(f"ℹ️ User '{current_user.id}' attempting to update flat '{flat_id}'.")
    db_flat = crud_flat.flat.get(db, id=flat_id)
    if db_flat is None:
        logger.warning(f"❌ Flat '{flat_id}' not found for update attempt by user '{current_user.id}'.")
        raise HTTPException(status_code=404, detail="Flat not found")
    updated_flat = crud_flat.flat.update(db, db_obj=db_flat, obj_in=flat_in)
    logger.info(f"✅ Flat '{updated_flat.id}' updated successfully by user '{current_user.id}'.")
    return updated_flat

@router.delete("/{flat_id}", response_model=Flat)
def delete_flat(
    flat_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_superuser), # Admin only
):
    logger.info(f"ℹ️ Admin '{current_user.id}' attempting to delete flat '{flat_id}'.")
    db_flat = crud_flat.flat.get(db, id=flat_id)
    if db_flat is None:
        logger.warning(f"❌ Flat '{flat_id}' not found for deletion attempt by admin '{current_user.id}'.")
        raise HTTPException(status_code=404, detail="Flat not found")
    deleted_flat = crud_flat.flat.remove(db, id=flat_id)
    logger.info(f"✅ Flat '{deleted_flat.id}' deleted successfully by admin '{current_user.id}'.")
    return deleted_flat