# filepath: backend/app/crud/crud_bin.py
from sqlalchemy.orm import Session
from typing import List
from app.crud.base import CRUDBase
from app.models.bin import Bin as BinModel
from app.schemas.bin import BinCreate, BinUpdate

class CRUDBin(CRUDBase[BinModel, BinCreate, BinUpdate]):
    def get_by_rack(self, db: Session, rack_id) -> List[BinModel]:
        return db.query(BinModel).filter(BinModel.rack_id == rack_id).all()

bin = CRUDBin(BinModel)
