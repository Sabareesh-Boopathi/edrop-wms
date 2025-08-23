from typing import List, Optional
import logging
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from app.models.address import Address
from app.schemas.address import AddressCreate, AddressUpdate
from .base import CRUDBase

class CRUDAddress(CRUDBase[Address, AddressCreate, AddressUpdate]):
    logger = logging.getLogger("app.crud.address")

    def create(self, db: Session, *, obj_in: AddressCreate) -> Address:
        try:
            self.logger.info("📝 Creating Address (city=%s, pincode=%s)", getattr(obj_in, "city", None), getattr(obj_in, "pincode", None))
            db_obj = self.model(**obj_in.dict())
            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)
            self.logger.info("✅ Address created id=%s", getattr(db_obj, "id", None))
            return db_obj
        except SQLAlchemyError as e:
            db.rollback()
            self.logger.exception("❌ Address create failed: %s", e)
            raise e
    
    def get_by_city(self, db: Session, city: str) -> List[Address]:
        """Get all addresses in a specific city."""
        self.logger.debug("🔎 Query addresses by city=%s", city)
        return db.query(Address).filter(Address.city == city).all()
    
    def get_by_pincode(self, db: Session, pincode: str) -> List[Address]:
        """Get all addresses with a specific pincode."""
        self.logger.debug("🔎 Query addresses by pincode=%s", pincode)
        return db.query(Address).filter(Address.pincode == pincode).all()
    
    def search_by_location(self, db: Session, *, city: Optional[str] = None, 
                          state: Optional[str] = None, pincode: Optional[str] = None) -> List[Address]:
        """Search addresses by location parameters."""
        self.logger.info("🔎 Search addresses filters city=%s state=%s pincode=%s", city, state, pincode)
        query = db.query(Address)
        
        if city:
            query = query.filter(Address.city.ilike(f"%{city}%"))
        if state:
            query = query.filter(Address.state.ilike(f"%{state}%"))
        if pincode:
            query = query.filter(Address.pincode == pincode)
            
        result = query.all()
        self.logger.info("✅ %d addresses matched filters", len(result))
        return result

address = CRUDAddress(Address)
