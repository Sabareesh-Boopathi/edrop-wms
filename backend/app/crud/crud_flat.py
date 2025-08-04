from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
import uuid
from app.models.flat import Flat
from app.schemas.flat import FlatCreate, FlatUpdate
from .base import CRUDBase

class CRUDFlat(CRUDBase[Flat, FlatCreate, FlatUpdate]):
    def create(self, db: Session, *, obj_in: FlatCreate) -> Flat:
        try:
            db_obj = self.model(**obj_in.dict())
            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)
            return db_obj
        except SQLAlchemyError as e:
            db.rollback()
            raise e

flat = CRUDFlat(Flat)