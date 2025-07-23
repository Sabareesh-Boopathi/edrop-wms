# filepath: backend/app/crud/crud_rwa.py
from typing import Any, Dict, Union, List
from sqlalchemy.orm import Session
import uuid

from app.models.rwa import RWA
from app.schemas.rwa import RWACreate, RWAUpdate
from .base import CRUDBase

class CRUDRwa(CRUDBase[RWA, RWACreate, RWAUpdate]):
    # You can add custom, model-specific methods here if needed.
    # For example:
    # def get_by_name(self, db: Session, *, name: str) -> RWA | None:
    #     return db.query(RWA).filter(RWA.name == name).first()
    pass

rwa = CRUDRwa(RWA)