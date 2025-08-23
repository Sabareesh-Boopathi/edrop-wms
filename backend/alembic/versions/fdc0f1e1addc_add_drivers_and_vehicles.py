"""add drivers and vehicles

Revision ID: fdc0f1e1addc
Revises: e068a58ad49e
Create Date: 2025-08-18 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'fdc0f1e1addc'
down_revision: Union[str, Sequence[str], None] = 'e068a58ad49e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'vehicles',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('reg_no', sa.String(length=50), nullable=False),
        sa.Column('type', sa.Enum('VAN_S', 'TRUCK_M', 'TRUCK_L', name='vehicletype'), nullable=False),
        sa.Column('capacity_totes', sa.Integer(), nullable=True),
        sa.Column('capacity_volume', sa.Integer(), nullable=True),
        sa.Column('status', sa.Enum('AVAILABLE', 'IN_SERVICE', 'MAINTENANCE', name='vehiclestatus'), nullable=False),
        sa.Column('carrier', sa.String(length=255), nullable=True),
        sa.Column('warehouse_id', sa.UUID(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['warehouse_id'], ['warehouses.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_vehicles_reg_no'), 'vehicles', ['reg_no'], unique=True)

    op.create_table(
        'drivers',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('phone', sa.String(length=50), nullable=False),
        sa.Column('license_no', sa.String(length=100), nullable=False),
        sa.Column('license_expiry', sa.String(length=20), nullable=True),
        sa.Column('status', sa.Enum('ACTIVE', 'INACTIVE', name='driverstatus'), nullable=False),
        sa.Column('carrier', sa.String(length=255), nullable=True),
        sa.Column('assigned_vehicle_id', sa.UUID(), nullable=True),
        sa.Column('warehouse_id', sa.UUID(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['assigned_vehicle_id'], ['vehicles.id'], ),
        sa.ForeignKeyConstraint(['warehouse_id'], ['warehouses.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_drivers_phone'), 'drivers', ['phone'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_drivers_phone'), table_name='drivers')
    op.drop_table('drivers')
    op.drop_index(op.f('ix_vehicles_reg_no'), table_name='vehicles')
    op.drop_table('vehicles')
    op.execute('DROP TYPE IF EXISTS vehicletype')
    op.execute('DROP TYPE IF EXISTS vehiclestatus')
    op.execute('DROP TYPE IF EXISTS driverstatus')
