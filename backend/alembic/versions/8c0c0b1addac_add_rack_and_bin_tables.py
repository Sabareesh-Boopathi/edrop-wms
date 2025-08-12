"""add rack and bin tables

Revision ID: 8c0c0b1addac
Revises: 68dfc10dd979
Create Date: 2025-08-09

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '8c0c0b1addac'
down_revision: Union[str, None] = '68dfc10dd979'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create enum type for bin status
    bin_status_enum = postgresql.ENUM('empty', 'occupied', 'reserved', 'blocked', 'maintenance', name='bin_status_enum')
    bin_status_enum.create(op.get_bind(), checkfirst=True)

    # Create racks table
    op.create_table(
        'racks',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('warehouse_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('stacks', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('bins_per_stack', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('description', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['warehouse_id'], ['warehouses.id'], ondelete='CASCADE'),
    )
    op.create_index('ix_racks_warehouse_id', 'racks', ['warehouse_id'])
    op.create_index('ix_racks_name', 'racks', ['name'])

    # Create bins table
    op.create_table(
        'bins',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('rack_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('stack_index', sa.Integer(), nullable=False),
        sa.Column('bin_index', sa.Integer(), nullable=False),
        sa.Column('code', sa.String(length=100), nullable=True),
        # Use dialect-specific ENUM to avoid implicit type creation
        sa.Column('status', postgresql.ENUM('empty', 'occupied', 'reserved', 'blocked', 'maintenance', name='bin_status_enum', create_type=False), nullable=False, server_default='empty'),
        sa.Column('crate_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('product_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('store_product_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('quantity', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['rack_id'], ['racks.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['crate_id'], ['crates.id']),
        sa.ForeignKeyConstraint(['product_id'], ['products.id']),
        sa.ForeignKeyConstraint(['store_product_id'], ['store_products.id']),
    )
    op.create_index('ix_bins_rack_id', 'bins', ['rack_id'])


def downgrade() -> None:
    op.drop_index('ix_bins_rack_id', table_name='bins')
    op.drop_table('bins')
    op.drop_index('ix_racks_name', table_name='racks')
    op.drop_index('ix_racks_warehouse_id', table_name='racks')
    op.drop_table('racks')

    # Drop enum type
    bin_status_enum = postgresql.ENUM('empty', 'occupied', 'reserved', 'blocked', 'maintenance', name='bin_status_enum')
    bin_status_enum.drop(op.get_bind(), checkfirst=True)
