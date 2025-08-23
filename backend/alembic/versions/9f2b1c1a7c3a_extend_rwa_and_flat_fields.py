"""Extend RWA and Flat fields (code/state/pincode/status/warehouse; flat lat/long)

Revision ID: 9f2b1c1a7c3a
Revises: 71b25fd57d71
Create Date: 2025-08-20 10:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = '9f2b1c1a7c3a'
down_revision: Union[str, Sequence[str], None] = '71b25fd57d71'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _has_column(inspector, table: str, column: str) -> bool:
    try:
        cols = [c['name'] for c in inspector.get_columns(table)]
        return column in cols
    except Exception:
        return False


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)

    # Ensure ENUM types exist (PostgreSQL)
    op.execute("""
    DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rwa_status_enum') THEN
            CREATE TYPE rwa_status_enum AS ENUM ('ACTIVE','INACTIVE');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'flat_status_enum') THEN
            CREATE TYPE flat_status_enum AS ENUM ('ACTIVE','INACTIVE');
        END IF;
    END $$;
    """)

    # rwas
    if _has_column(inspector, 'rwas', 'name'):
        if not _has_column(inspector, 'rwas', 'code'):
            op.add_column('rwas', sa.Column('code', sa.String(length=50), nullable=True))
            op.create_index(op.f('ix_rwas_code'), 'rwas', ['code'])
        if not _has_column(inspector, 'rwas', 'state'):
            op.add_column('rwas', sa.Column('state', sa.String(length=100), nullable=True))
        if not _has_column(inspector, 'rwas', 'pincode'):
            op.add_column('rwas', sa.Column('pincode', sa.String(length=20), nullable=True))
        if not _has_column(inspector, 'rwas', 'status'):
            op.add_column('rwas', sa.Column('status', sa.Enum('ACTIVE', 'INACTIVE', name='rwa_status_enum'), nullable=True))
        if not _has_column(inspector, 'rwas', 'warehouse_id'):
            op.add_column('rwas', sa.Column('warehouse_id', sa.UUID(), nullable=True))
            # Optional FK if warehouses table exists
            try:
                op.create_foreign_key(None, 'rwas', 'warehouses', ['warehouse_id'], ['id'])
            except Exception:
                pass

    # flats
    if _has_column(inspector, 'flats', 'flat_number'):
        if not _has_column(inspector, 'flats', 'address_line'):
            op.add_column('flats', sa.Column('address_line', sa.String(length=255), nullable=True))
        if not _has_column(inspector, 'flats', 'building_name'):
            op.add_column('flats', sa.Column('building_name', sa.String(length=100), nullable=True))
        if not _has_column(inspector, 'flats', 'latitude'):
            op.add_column('flats', sa.Column('latitude', sa.Numeric(precision=10, scale=7), nullable=True))
        if not _has_column(inspector, 'flats', 'longitude'):
            op.add_column('flats', sa.Column('longitude', sa.Numeric(precision=10, scale=7), nullable=True))
        if not _has_column(inspector, 'flats', 'status'):
            op.add_column('flats', sa.Column('status', sa.Enum('ACTIVE', 'INACTIVE', name='flat_status_enum'), nullable=True))


def downgrade() -> None:
    # Best-effort drop columns (ignoring errors to be safe)
    for tbl, cols in [
        ('rwas', ['warehouse_id','status','pincode','state','code']),
        ('flats',['status','longitude','latitude','building_name','address_line'])
    ]:
        for c in cols:
            try:
                op.drop_column(tbl, c)
            except Exception:
                pass
    try:
        op.drop_index(op.f('ix_rwas_code'), table_name='rwas')
    except Exception:
        pass
    # Drop ENUM types last
    try:
        op.execute("DROP TYPE IF EXISTS flat_status_enum")
    except Exception:
        pass
    try:
        op.execute("DROP TYPE IF EXISTS rwa_status_enum")
    except Exception:
        pass
