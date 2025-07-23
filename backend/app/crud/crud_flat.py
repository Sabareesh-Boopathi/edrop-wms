from sqlalchemy.orm import Session
import uuid
from app.models.flat import Flat
from app.schemas.flat import FlatCreate, FlatUpdate
from .base import CRUDBase

class CRUDFlat(CRUDBase[Flat, FlatCreate, FlatUpdate]):
    pass

flat = CRUDFlat(Flat)