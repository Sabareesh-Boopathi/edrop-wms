from __future__ import annotations  # Enable forward references
from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional
from uuid import UUID
from app.db.base_class import Base
from app.schemas.store_products import StoreProduct  # Ensure StoreProduct is defined

# Base Pydantic Schema
class StoreBase(BaseModel):
    store_name: str
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    store_ratings: Optional[float] = None
    store_reviews_count: Optional[int] = None
    store_status: str  # ACTIVE, INACTIVE
    operation_start_time: Optional[str] = None  # e.g., 09:00 AM
    operation_end_time: Optional[str] = None  # e.g., 09:00 PM
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

# Schema for creating a store
class StoreCreate(StoreBase):
    vendor_id: UUID

# Schema for updating a store
class StoreUpdate(StoreBase):
    store_name: str | None = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    store_status: Optional[str] = None

# Schema for reading a store
class Store(StoreBase):
    id: UUID
    vendor_id: UUID
    # Use concrete import instead of forward-ref string to prevent unresolved type issues
    store_products: List[StoreProduct] = []

    class Config:
        from_attributes = True
