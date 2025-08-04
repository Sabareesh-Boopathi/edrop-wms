"""
Add new fields to warehouse table
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ENUM
from datetime import date
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision = 'add_new_fields_to_warehouse'
down_revision = '6e0e74e00f41'
branch_labels = None
depends_on = None

def upgrade():
    status_enum = sa.Enum('ACTIVE', 'INACTIVE', 'NEAR_CAPACITY', name='warehousestatus')
    status_enum.create(op.get_bind(), checkfirst=True)

    inspector = inspect(op.get_bind())
    columns = [col['name'] for col in inspector.get_columns('warehouses')]
    if 'status' not in columns:
        op.add_column('warehouses', sa.Column('status', status_enum, nullable=False))
    if 'size_sqft' not in columns:
        op.add_column('warehouses', sa.Column('size_sqft', sa.Integer(), nullable=False))
    if 'utilization_pct' not in columns:
        op.add_column('warehouses', sa.Column('utilization_pct', sa.Numeric(), nullable=False))
    if 'start_date' not in columns:
        op.add_column('warehouses', sa.Column('start_date', sa.Date(), nullable=False))
    if 'end_date' not in columns:
        op.add_column('warehouses', sa.Column('end_date', sa.Date(), nullable=True))
    if 'capacity_units' not in columns:
        op.add_column('warehouses', sa.Column('capacity_units', sa.Integer(), nullable=True))
    if 'operations_time' not in columns:
        op.add_column('warehouses', sa.Column('operations_time', sa.String(), nullable=True))
    if 'contact_phone' not in columns:
        op.add_column('warehouses', sa.Column('contact_phone', sa.String(), nullable=True))
    if 'contact_email' not in columns:
        op.add_column('warehouses', sa.Column('contact_email', sa.String(), nullable=True))

def downgrade():
    op.drop_column('warehouses', 'contact_email')
    op.drop_column('warehouses', 'contact_phone')
    op.drop_column('warehouses', 'operations_time')
    op.drop_column('warehouses', 'capacity_units')
    op.drop_column('warehouses', 'end_date')
    op.drop_column('warehouses', 'start_date')
    op.drop_column('warehouses', 'utilization_pct')
    op.drop_column('warehouses', 'size_sqft')
    op.drop_column('warehouses', 'status')

    status_enum = sa.Enum('ACTIVE', 'INACTIVE', 'NEAR_CAPACITY', name='warehousestatus')
    status_enum.drop(op.get_bind(), checkfirst=True)
