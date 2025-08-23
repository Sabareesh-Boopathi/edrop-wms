# filepath: backend/app/crud/crud_user.py
from typing import Any, Dict, Optional, Union
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
import uuid
import logging

from app.core.security import get_password_hash, verify_password
from app.crud.base import CRUDBase
from app.models.user import User
from app.models.warehouse import Warehouse  # Import Warehouse model
from app.schemas.user import UserCreate, UserUpdate
from app.services.milestone_service import check_and_create_milestone, MilestoneEventType, MilestoneEntityType

class CRUDUser(CRUDBase[User, UserCreate, UserUpdate]):
    def get_by_email(self, db: Session, *, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email).first()

    def create(self, db: Session, *, obj_in: UserCreate) -> User:
        try:
            # Normalize role/status to plain uppercase strings (avoid Enum instances hitting DB)
            role_value = None
            if obj_in.role is not None:
                role_value = (obj_in.role.value if hasattr(obj_in.role, "value") else str(obj_in.role)).upper()
            status_value = None
            if obj_in.status is not None:
                status_value = (obj_in.status.value if hasattr(obj_in.status, "value") else str(obj_in.status)).upper()

            # Prepare kwargs; only include role/status if present to allow DB defaults otherwise
            # Validate warehouse_id if provided (avoid FK violation on insert)
            valid_warehouse_id = obj_in.warehouse_id
            if valid_warehouse_id:
                try:
                    exists = db.query(Warehouse).get(valid_warehouse_id)
                    if not exists:
                        valid_warehouse_id = None
                except Exception:
                    valid_warehouse_id = None

            kwargs: dict[str, object] = {
                "email": obj_in.email,
                "name": obj_in.name,
                "hashed_password": get_password_hash(obj_in.password),
                "warehouse_id": valid_warehouse_id,
            }
            if role_value:
                kwargs["role"] = role_value
            if status_value:
                kwargs["status"] = status_value

            # Create the user
            db_obj = User(**kwargs)
            db.add(db_obj)

            # Check for system-level user count milestones
            total_users = len(self.get_multi(db))
            check_and_create_milestone(
                db,
                event_type=MilestoneEventType.CUSTOMER_COUNT,
                entity_type=MilestoneEntityType.CUSTOMER,
                entity_id=str(db_obj.id),
                current_count=total_users,
                description="🎉 A new system-wide user milestone has been reached!",
                title="System User Registration Milestone",
                milestone_type="customer_count"
            )

            # Check for warehouse-level user count milestones (if warehouse_id is provided)
            if db_obj.warehouse_id:
                warehouse_user_count = db.query(User).filter(User.warehouse_id == db_obj.warehouse_id).count()
                wh = db.query(Warehouse).get(db_obj.warehouse_id)
                wh_name = wh.name if wh else "Warehouse"
                check_and_create_milestone(
                    db,
                    event_type=MilestoneEventType.CUSTOMER_COUNT,
                    entity_type=MilestoneEntityType.CUSTOMER,
                    entity_id=str(db_obj.warehouse_id),
                    current_count=warehouse_user_count,
                    description=f"🎉 {wh_name} reached {warehouse_user_count} users!",
                    title=f"{wh_name} User Milestone",
                    milestone_type="warehouse_user_count",
                    warehouse_id=str(db_obj.warehouse_id)
                )

            # Commit the transaction only after all operations are successful
            db.commit()
            db.refresh(db_obj)
            # Return the ORM instance; Pydantic model has from_attributes=True
            # so it will serialize UUIDs and nullable fields correctly.
            return db_obj
        except SQLAlchemyError as e:
            db.rollback()
            raise e

    def update(
        self,
        db: Session,
        *,
        db_obj: User,
        obj_in: Union[UserUpdate, Dict[str, Any]]
    ) -> User:
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)

        if "password" in update_data and update_data["password"]:
            hashed_password = get_password_hash(update_data["password"])
            del update_data["password"]
            update_data["hashed_password"] = hashed_password

        if "role" in update_data and update_data["role"] is not None:
            value = update_data["role"]
            if hasattr(value, "value"):
                value = value.value
            update_data["role"] = str(value).upper()

        if "status" in update_data and update_data["status"] is not None:
            value = update_data["status"]
            if hasattr(value, "value"):
                value = value.value
            update_data["status"] = str(value).upper()

        if "warehouse_id" in update_data:
            db_obj.warehouse_id = update_data["warehouse_id"]

        updated_obj = super().update(db, db_obj=db_obj, obj_in=update_data)
        return updated_obj

    def authenticate_and_validate(self, db: Session, *, email: str, password: str) -> User:
        """Authenticate the user and validate their status."""
        user = self.get_by_email(db, email=email)
        if not user:
            raise ValueError("Invalid email or password")
        if not verify_password(password, user.hashed_password):
            raise ValueError("Invalid email or password")
        if user.status != "ACTIVE":
            raise ValueError("User is INACTIVE or PENDING")
        return user

    def is_active(self, user: User) -> bool:
        return user.status == "ACTIVE"

    def get_with_warehouse(self, db: Session, *, user_id: uuid.UUID):
        """Fetch a user along with their warehouse details."""
        result = (
            db.query(User, Warehouse)
            .join(Warehouse, User.warehouse_id == Warehouse.id, isouter=True)
            .filter(User.id == user_id)
            .first()
        )
        if result:
            user, warehouse = result
            return {
                **user.__dict__,
                "warehouse_id": str(user.warehouse_id),  # Ensure warehouse_id is included
                "warehouse_name": warehouse.name if warehouse else None,
            }
        return None

    def get_all_with_warehouses(self, db: Session):
        """Fetch all users along with their warehouse details."""
        results = (
            db.query(User, Warehouse)
            .join(Warehouse, User.warehouse_id == Warehouse.id, isouter=True)
            .all()
        )
        return [
            (user, warehouse) for user, warehouse in results
        ]

user = CRUDUser(User)