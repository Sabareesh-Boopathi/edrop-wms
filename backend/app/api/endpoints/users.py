# filepath: backend/app/api/endpoints/users.py
from typing import List
import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
 

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
    current_user: UserModel = Depends(deps.get_current_active_user),
):
    """
    Retrieve users.
    - ADMIN: all users
    - MANAGER: users within their warehouse
    - Others: self only
    """
    role = str(getattr(current_user, "role", "")).upper()
    if role == "ADMIN":
        logger.info(f"ℹ️ Admin '{current_user.id}' listing all users.")
        return crud_user.user.get_multi(db, skip=skip, limit=limit)
    if role == "MANAGER":
        logger.info(f"ℹ️ Manager '{current_user.id}' listing users for warehouse '{current_user.warehouse_id}'.")
        # Fetch all and filter by warehouse_id match
        all_users = crud_user.user.get_multi(db, skip=skip, limit=limit)
        return [u for u in all_users if getattr(u, "warehouse_id", None) == getattr(current_user, "warehouse_id", None)]
    logger.info(f"ℹ️ Non-admin '{current_user.id}' fetching self only.")
    me = crud_user.user.get(db, id=current_user.id)
    return [me] if me else []

@router.post("/", response_model=User)
def create_user(
    *,
    db: Session = Depends(deps.get_db),
    user_in: UserCreate,
    current_user: UserModel = Depends(deps.get_current_active_user),
    _=Depends(deps.ensure_not_viewer_for_write),
):
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
    # Role-based constraints
    role = str(getattr(current_user, "role", "")).upper()
    if role == "VIEWER":
        raise HTTPException(status_code=403, detail="VIEWER cannot create users")
    # Managers can only create users for their own warehouse and cannot create ADMINs
    if role == "MANAGER":
        if str(getattr(user_in, "role", "")).upper() == "ADMIN":
            raise HTTPException(status_code=403, detail="MANAGER cannot create ADMIN users")
        # Force the warehouse_id to manager's warehouse
        try:
            user_in.warehouse_id = current_user.warehouse_id
        except Exception:
            # pydantic BaseModel may be immutable; fallback to dict patch
            data = user_in.dict()
            data["warehouse_id"] = current_user.warehouse_id
            user_in = UserCreate(**data)

    new_user = crud_user.user.create(db, obj_in=user_in)
    logger.info(f"✅ Successfully created user with ID: {new_user.id}")
    return new_user

@router.get("/me", response_model=User)
def read_user_me(current_user: UserModel = Depends(deps.get_current_active_user)):
    """
    Get current user's profile.
    """
    logger.info(f"ℹ️ User '{current_user.id}' requesting their own profile.")
    return current_user

@router.get("/with-warehouses", response_model=List[User])
def read_users_with_warehouses(
    db: Session = Depends(deps.get_db),
    current_user: UserModel = Depends(deps.get_current_active_user),
):
    """
    Retrieve users along with their warehouse details.
    - ADMIN: all users with warehouse
    - MANAGER: users in own warehouse with warehouse details
    - Others: self with warehouse
    """
    role = str(getattr(current_user, "role", "")).upper()
    if role == "ADMIN":
        logger.info(f"ℹ️ Admin '{current_user.id}' listing all users with warehouses.")
        users_with_warehouses = crud_user.user.get_all_with_warehouses(db)
        return [
            {
                **user.__dict__,
                "warehouse": warehouse.name if warehouse else None
            }
            for user, warehouse in users_with_warehouses
        ]
    if role == "MANAGER":
        logger.info(f"ℹ️ Manager '{current_user.id}' listing users for warehouse '{current_user.warehouse_id}' with warehouses.")
        users_with_warehouses = crud_user.user.get_all_with_warehouses(db)
        filtered = []
        for user, warehouse in users_with_warehouses:
            if getattr(user, "warehouse_id", None) == getattr(current_user, "warehouse_id", None):
                filtered.append({ **user.__dict__, "warehouse": warehouse.name if warehouse else None })
        return filtered
    logger.info(f"ℹ️ Non-admin '{current_user.id}' fetching self with warehouse.")
    result = crud_user.user.get_with_warehouse(db, user_id=current_user.id)
    return [result] if result else []

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
    role = str(getattr(current_user, "role", "")).upper()
    if user.id != current_user.id and role != "ADMIN":
        # Allow MANAGER to read users within the same warehouse
        if role == "MANAGER" and getattr(user, "warehouse_id", None) == getattr(current_user, "warehouse_id", None):
            return user
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
    _=Depends(deps.ensure_not_viewer_for_write),
):
    """
    Update a user.
    """
    logger.info(f"ℹ️ User '{current_user.id}' attempting to update user '{user_id}'.")
    user = crud_user.user.get(db, id=user_id)
    if not user:
        logger.warning(f"❌ User '{user_id}' not found for update attempt by user '{current_user.id}'.")
        raise HTTPException(status_code=404, detail="User not found")
    role = str(getattr(current_user, "role", "")).upper()
    if user.id != current_user.id and role != "ADMIN":
        # Managers can update users in their own warehouse, except making them ADMIN or moving warehouses
        same_wh = getattr(user, "warehouse_id", None) == getattr(current_user, "warehouse_id", None)
        if role == "MANAGER" and same_wh:
            # Disallow making admin or changing warehouse away from manager's warehouse
            new_role = str(getattr(user_in, "role", getattr(user, "role", ""))).upper() if hasattr(user_in, "role") else str(getattr(user, "role", "")).upper()
            if new_role == "ADMIN":
                raise HTTPException(status_code=403, detail="MANAGER cannot promote users to ADMIN")
            # Enforce warehouse lock
            try:
                if hasattr(user_in, "warehouse_id") and user_in.warehouse_id and user_in.warehouse_id != current_user.warehouse_id:
                    raise HTTPException(status_code=403, detail="Cannot change warehouse outside manager's scope")
            except AttributeError:
                pass
        else:
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
    current_user: UserModel = Depends(deps.get_current_active_user),
    _=Depends(deps.ensure_not_viewer_for_write),
):
    """
    Delete a user.
    - ADMIN: any user
    - MANAGER: users within their own warehouse (cannot delete ADMIN)
    """
    role = str(getattr(current_user, "role", "")).upper()
    logger.info(f"ℹ️ User '{current_user.id}' attempting to delete user '{user_id}'.")
    user = crud_user.user.get(db, id=user_id)
    if not user:
        logger.warning(f"❌ User '{user_id}' not found for deletion attempt by user '{current_user.id}'.")
        raise HTTPException(status_code=404, detail="User not found")
    if role == "ADMIN":
        deleted_user = crud_user.user.remove(db, id=user_id)
        logger.info(f"✅ User '{user.id}' deleted successfully by admin '{current_user.id}'.")
        return deleted_user
    if role == "MANAGER":
        # Scope to manager's warehouse and disallow deleting admins
        if getattr(user, "warehouse_id", None) != getattr(current_user, "warehouse_id", None):
            raise HTTPException(status_code=403, detail="Cannot delete user outside manager's warehouse")
        if str(getattr(user, "role", "")).upper() == "ADMIN":
            raise HTTPException(status_code=403, detail="Cannot delete ADMIN users")
        deleted_user = crud_user.user.remove(db, id=user_id)
        logger.info(f"✅ User '{user.id}' deleted successfully by manager '{current_user.id}'.")
        return deleted_user
    raise HTTPException(status_code=403, detail="Not enough permissions")