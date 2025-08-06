# filepath: backend/app/api/endpoints/users.py
from typing import List
import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from jose.exceptions import ExpiredSignatureError

from app.api import deps
from app.crud import crud_user
from app.models.user import User as UserModel
from app.schemas.user import User, UserCreate, UserUpdate

router = APIRouter()
logger = logging.getLogger("app.api.endpoints.users")

@router.get("/", response_model=List[User])
def read_users(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: UserModel = Depends(deps.get_current_active_superuser),
):
    """
    Retrieve all users. (Admins only)
    """
    logger.info(f"ℹ️ Admin '{current_user.id}' listing all users.")
    return crud_user.user.get_multi(db, skip=skip, limit=limit)

@router.post("/", response_model=User)
def create_user(*, db: Session = Depends(deps.get_db), user_in: UserCreate):
    """
    Create new user. (Public)
    """
    logger.info(f"ℹ️ Attempting to create user with email: {user_in.email}")
    user = crud_user.user.get_by_email(db, email=user_in.email)
    if user:
        logger.warning(f"⚠️ User creation failed: email {user_in.email} already exists.")
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    new_user = crud_user.user.create(db, obj_in=user_in)
    logger.info(f"✅ Successfully created user with ID: {new_user.id}")
    return new_user

@router.get("/me", response_model=User)
def read_user_me(current_user: UserModel = Depends(deps.get_current_active_user)):
    """
    Get current user's profile.
    """
    logger.info(f"ℹ️ User '{current_user.id}' requesting their own profile.")
    try:
        return current_user
    except ExpiredSignatureError as e:
        logger.error(f"❌ Token expired: {str(e)}")
        raise HTTPException(status_code=401, detail="Token has expired. Please log in again.")

@router.get("/with-warehouses", response_model=List[User])
def read_users_with_warehouses(
    db: Session = Depends(deps.get_db),
    current_user: UserModel = Depends(deps.get_current_active_superuser),
):
    """
    Retrieve all users along with their warehouse details. (Admins only)
    """
    logger.info(f"ℹ️ Admin '{current_user.id}' listing all users with warehouses.")
    users_with_warehouses = crud_user.user.get_all_with_warehouses(db)
    return [
        {
            **user.__dict__,
            "warehouse": warehouse.name if warehouse else None
        }
        for user, warehouse in users_with_warehouses
    ]

@router.get("/{user_id}", response_model=User)
def read_user_by_id(
    user_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user: UserModel = Depends(deps.get_current_active_user),
):
    """
    Get a specific user by ID.
    """
    logger.info(f"ℹ️ User '{current_user.id}' requesting profile for user '{user_id}'.")
    user = crud_user.user.get(db, id=user_id)
    if not user:
        logger.warning(f"❌ User '{user_id}' not found for request from user '{current_user.id}'.")
        raise HTTPException(status_code=404, detail="User not found")
    if user.id != current_user.id and current_user.role != "ADMIN":
        logger.warning(f"🚫 Permission denied: User '{current_user.id}' attempted to read profile of user '{user.id}'.")
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return user

@router.put("/{user_id}", response_model=User)
def update_user(
    *,
    db: Session = Depends(deps.get_db),
    user_id: uuid.UUID,
    user_in: UserUpdate,
    current_user: UserModel = Depends(deps.get_current_active_user),
):
    """
    Update a user.
    """
    logger.info(f"ℹ️ User '{current_user.id}' attempting to update user '{user_id}'.")
    user = crud_user.user.get(db, id=user_id)
    if not user:
        logger.warning(f"❌ User '{user_id}' not found for update attempt by user '{current_user.id}'.")
        raise HTTPException(status_code=404, detail="User not found")
    if user.id != current_user.id and current_user.role != "ADMIN":
        logger.warning(f"🚫 Permission denied: User '{current_user.id}' attempted to update user '{user.id}'.")
        raise HTTPException(status_code=403, detail="Not enough permissions")
    updated_user = crud_user.user.update(db, db_obj=user, obj_in=user_in)
    logger.info(f"✅ User '{user.id}' updated successfully by user '{current_user.id}'.")
    return updated_user

@router.delete("/{user_id}", response_model=User)
def delete_user(
    *,
    db: Session = Depends(deps.get_db),
    user_id: uuid.UUID,
    current_user: UserModel = Depends(deps.get_current_active_superuser),
):
    """
    Delete a user. (Admins only)
    """
    logger.info(f"ℹ️ Admin '{current_user.id}' attempting to delete user '{user_id}'.")
    user = crud_user.user.get(db, id=user_id)
    if not user:
        logger.warning(f"❌ User '{user_id}' not found for deletion attempt by admin '{current_user.id}'.")
        raise HTTPException(status_code=404, detail="User not found")
    deleted_user = crud_user.user.remove(db, id=user_id)
    logger.info(f"✅ User '{user.id}' deleted successfully by admin '{current_user.id}'.")
    return deleted_user