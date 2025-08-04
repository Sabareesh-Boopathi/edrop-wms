# filepath: backend/app/crud/crud_user.py
from typing import Any, Dict, Optional, Union
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.core.security import get_password_hash, verify_password
from app.crud.base import CRUDBase
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.services.milestone_service import check_and_create_milestone, MilestoneEventType, MilestoneEntityType

class CRUDUser(CRUDBase[User, UserCreate, UserUpdate]):
    def get_by_email(self, db: Session, *, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email).first()

    def create(self, db: Session, *, obj_in: UserCreate) -> User:
        try:
            db_obj = User(
                email=obj_in.email,
                name=obj_in.name,
                hashed_password=get_password_hash(obj_in.password),
                role=obj_in.role.upper(),  # Normalize to uppercase
                status=obj_in.status  # Use status directly
            )
            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)

            # Check for user count milestones
            total_users = self.get_multi(db)
            # Create a milestone for user registration
            check_and_create_milestone(
                db,
                event_type=MilestoneEventType.CUSTOMER_COUNT,
                entity_type=MilestoneEntityType.CUSTOMER,
                entity_id=str(db_obj.id),
                current_count=total_users,
                description="🎉 A new user milestone has been reached!",
                title="User registration milestone",
                milestone_type="customer_count"
            )
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

        if "role" in update_data:
            update_data["role"] = update_data["role"].upper()  # Normalize to uppercase

        return super().update(db, db_obj=db_obj, obj_in=update_data)

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

user = CRUDUser(User)