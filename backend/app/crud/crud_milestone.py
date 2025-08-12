"""
CRUD operations for Milestone model.
"""
from typing import Optional, List
from sqlalchemy.orm import Session
from .base import CRUDBase
from app.models.milestone import Milestone, MilestoneEntityType
from app.schemas.milestone import MilestoneCreate, MilestoneUpdate
from app.models.user import User
from app.models.warehouse import Warehouse
from app.models.notification import Notification
import logging

logger = logging.getLogger(__name__)

class CRUDMilestone(CRUDBase[Milestone, MilestoneCreate, MilestoneUpdate]):
    def create(self, db: Session, *, obj_in: MilestoneCreate) -> Milestone:
        # Create the milestone first using base logic (no notifications yet)
        milestone_obj = super().create(db, obj_in=obj_in)

        try:
            # Identify recipients: all active ADMINs
            admin_users: List[User] = (
                db.query(User)
                .filter(User.role == 'ADMIN', User.status == 'ACTIVE')
                .all()
            )

            recipients: List[User] = list(admin_users)

            # If milestone is for a warehouse, add that warehouse's manager
            if obj_in.related_entity_id and obj_in.entity_type == MilestoneEntityType.WAREHOUSE:
                wh: Optional[Warehouse] = db.query(Warehouse).get(obj_in.related_entity_id)
                if wh and wh.manager_id:
                    wm: Optional[User] = db.query(User).get(wh.manager_id)
                    if wm and wm.status == 'ACTIVE' and all(u.id != wm.id for u in recipients):
                        recipients.append(wm)

            # Create notifications for recipients
            title = obj_in.title or 'New Milestone'
            message = obj_in.description or f"Milestone achieved: {obj_in.milestone_type} => {obj_in.milestone_value}"
            for user in recipients:
                notif = Notification(
                    user_id=user.id,
                    title=title,
                    message=message,
                    milestone_id=milestone_obj.id,
                )
                db.add(notif)

            db.commit()
        except Exception as e:
            logger.error(f"Failed to create notifications for milestone {milestone_obj.id}: {e}")
            db.rollback()
        return milestone_obj


milestone = CRUDMilestone(Milestone)
