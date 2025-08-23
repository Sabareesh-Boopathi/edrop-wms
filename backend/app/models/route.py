import uuid
from datetime import datetime
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql as pg
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Table
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base_class import Base


# Association: Route <-> Community (many-to-many)
route_community_association = Table(
    'route_community_association',
    Base.metadata,
    Column('route_id', UUID(as_uuid=True), ForeignKey('routes.id', ondelete='CASCADE'), primary_key=True),
    Column('community_id', UUID(as_uuid=True), ForeignKey('communities.id', ondelete='CASCADE'), primary_key=True),
)


class Route(Base):
    __tablename__ = 'routes'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, index=True)
    warehouse_id = Column(UUID(as_uuid=True), ForeignKey('warehouses.id', ondelete='SET NULL'), nullable=True, index=True)
    status = Column(pg.ENUM('pending', 'waiting', 'ready', 'dispatched', 'hold', name='route_state_enum', create_type=False), nullable=False, default='pending')
    auto_slotting = Column(Boolean, nullable=False, default=True)
    driver_id = Column(UUID(as_uuid=True), ForeignKey('drivers.id', ondelete='SET NULL'), nullable=True)
    vehicle_id = Column(UUID(as_uuid=True), ForeignKey('vehicles.id', ondelete='SET NULL'), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    bins = relationship('RouteBin', back_populates='route', cascade='all, delete-orphan')
    communities = relationship('Community', secondary=route_community_association, backref='routes')
    driver = relationship('Driver')
    vehicle = relationship('Vehicle')


class RouteBin(Base):
    __tablename__ = 'route_bins'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    route_id = Column(UUID(as_uuid=True), ForeignKey('routes.id', ondelete='CASCADE'), nullable=False, index=True)
    code = Column(String(100), nullable=False, index=True)  # logical bin id shown in UI
    capacity = Column(Integer, nullable=True)
    locked = Column(Boolean, nullable=False, default=False)

    route = relationship('Route', back_populates='bins')
    crates = relationship('Crate', secondary='route_bin_crates', backref='route_bins')


# Association: RouteBin <-> Crate (many-to-many)
route_bin_crates = Table(
    'route_bin_crates',
    Base.metadata,
    Column('route_bin_id', UUID(as_uuid=True), ForeignKey('route_bins.id', ondelete='CASCADE'), primary_key=True),
    Column('crate_id', UUID(as_uuid=True), ForeignKey('crates.id', ondelete='CASCADE'), primary_key=True),
)


class DispatchLoadingLog(Base):
    __tablename__ = 'dispatch_loading_logs'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    route_id = Column(UUID(as_uuid=True), ForeignKey('routes.id', ondelete='CASCADE'), nullable=False, index=True)
    ts = Column(DateTime, default=datetime.utcnow, nullable=False)
    crate_id = Column(UUID(as_uuid=True), ForeignKey('crates.id', ondelete='SET NULL'), nullable=True)
    tote_code = Column(String(255), nullable=True)  # fallback when crate not resolvable
    ok = Column(Boolean, nullable=False, default=True)
    note = Column(String(500), nullable=True)
    crate = relationship('Crate')
