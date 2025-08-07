from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import logging

from app import crud, models, schemas
from app.api import deps

router = APIRouter()
logger = logging.getLogger("app.api.endpoints.crates")


@router.get("/", response_model=List[schemas.Crate])
def read_crates(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_user),
):
    """
    Retrieve crates.
    """
    logger.info(f"🔍 User '{current_user.id}' fetching crates with skip={skip} and limit={limit}.")
    crates = crud.crate.get_multi(db, skip=skip, limit=limit)
    logger.info(f"✅ Retrieved {len(crates)} crates for user '{current_user.id}'.")
    return crates


@router.post("/", response_model=schemas.Crate)
def create_crate(
    *,
    db: Session = Depends(deps.get_db),
    crate_in: schemas.CrateCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
):
    """
    Create new crate.
    """
    logger.info(f"ℹ️ User '{current_user.id}' attempting to create crate: {crate_in.name}.")
    crate = crud.crate.create(db=db, obj_in=crate_in)
    logger.info(f"✅ Crate '{crate.id}' created successfully by user '{current_user.id}'.")
    return crate


@router.put("/{id}", response_model=schemas.Crate)
def update_crate(
    *,
    db: Session = Depends(deps.get_db),
    id: str,
    crate_in: schemas.CrateUpdate,
    current_user: models.User = Depends(deps.get_current_active_user),
):
    """
    Update a crate.
    """
    logger.info(f"ℹ️ User '{current_user.id}' attempting to update crate '{id}'.")
    crate = crud.crate.get(db=db, id=id)
    if not crate:
        logger.warning(f"❌ Crate '{id}' not found for update by user '{current_user.id}'.")
        raise HTTPException(status_code=404, detail="Crate not found")
    crate = crud.crate.update(db=db, db_obj=crate, obj_in=crate_in)
    logger.info(f"✅ Crate '{id}' updated successfully by user '{current_user.id}'.")
    return crate


@router.get("/{id}", response_model=schemas.Crate)
def read_crate(
    *,
    db: Session = Depends(deps.get_db),
    id: str,
    current_user: models.User = Depends(deps.get_current_active_user),
):
    """
    Get crate by ID.
    """
    logger.info(f"🔍 User '{current_user.id}' fetching crate '{id}'.")
    crate = crud.crate.get(db=db, id=id)
    if not crate:
        logger.warning(f"❌ Crate '{id}' not found for user '{current_user.id}'.")
        raise HTTPException(status_code=404, detail="Crate not found")
    logger.info(f"✅ Crate '{id}' retrieved successfully for user '{current_user.id}'.")
    return crate


@router.delete("/{id}", response_model=schemas.Crate)
def delete_crate(
    *,
    db: Session = Depends(deps.get_db),
    id: str,
    current_user: models.User = Depends(deps.get_current_active_user),
):
    """
    Delete a crate.
    """
    logger.info(f"ℹ️ User '{current_user.id}' attempting to delete crate '{id}'.")
    crate = crud.crate.get(db=db, id=id)
    if not crate:
        logger.warning(f"❌ Crate '{id}' not found for deletion by user '{current_user.id}'.")
        raise HTTPException(status_code=404, detail="Crate not found")
    crate = crud.crate.remove(db=db, id=id)
    logger.info(f"✅ Crate '{id}' deleted successfully by user '{current_user.id}'.")
    return crate
