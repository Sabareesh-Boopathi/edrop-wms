# filepath: backend/app/crud/crud_community.py
from typing import Any, Dict, Union, List
import logging
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
import uuid

from app.models.community import Community
from app.schemas.community import CommunityCreate, CommunityUpdate
from .base import CRUDBase

class CRUDCommunity(CRUDBase[Community, CommunityCreate, CommunityUpdate]):
    # You can add custom, model-specific methods here if needed.
    logger = logging.getLogger("app.crud.community")
    
    def create(self, db: Session, *, obj_in: CommunityCreate) -> Community:
        try:
            data = obj_in.model_dump() if hasattr(obj_in, 'model_dump') else obj_in.dict()
            self.logger.info("📝 Creating Community name=%s city=%s", data.get("name"), data.get("city"))
            db_obj = self.model(**data)
            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)
            self.logger.info("✅ Community created id=%s", getattr(db_obj, "id", None))
            return db_obj
        except SQLAlchemyError as e:
            db.rollback()
            self.logger.exception("❌ Community create failed: %s", e)
            raise e

    def get_multi_by_warehouse(self, db: Session, *, warehouse_id: uuid.UUID | None = None, skip: int = 0, limit: int = 100) -> list[Community]:
        self.logger.debug("🔎 List communities by warehouse_id=%s skip=%s limit=%s", warehouse_id, skip, limit)
        q = db.query(self.model)
        if warehouse_id:
            q = q.filter(self.model.warehouse_id == warehouse_id)
        res = q.offset(skip).limit(limit).all()
        self.logger.debug("✅ Returned %d communities", len(res))
        return res

    def get_by_community_name(self, db: Session, *, community_name: str) -> Community | None:
        return db.query(self.model).filter(self.model.name == community_name).first()

    def get_by_rwa_name(self, db: Session, *, rwa_name: str) -> Community | None:
        return db.query(self.model).filter(self.model.rwa_name == rwa_name).first()

community = CRUDCommunity(Community)
