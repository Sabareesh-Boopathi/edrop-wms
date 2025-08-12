"""add unique indexes for codes

Revision ID: add_unique_indexes_for_codes
Revises: 1b3ee607a244
Create Date: 2025-08-10

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'add_unique_indexes_for_codes'
down_revision: Union[str, None] = '1b3ee607a244'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Unique crate name across table
    op.create_unique_constraint('uq_crates_name', 'crates', ['name'])
    # Unique rack name within a warehouse: implement as composite unique index
    op.create_unique_constraint('uq_racks_warehouse_name', 'racks', ['warehouse_id', 'name'])
    # Unique bin code across table
    op.create_unique_constraint('uq_bins_code', 'bins', ['code'])
    # Unique warehouse shortCode across warehouses via expression index on JSONB
    # Note: This is Postgres-specific; uses expression index on (data->>'shortCode')
    op.create_index('uq_warehouse_configs_short_code', 'warehouse_configs', [sa.text("(data->>'shortCode')")], unique=True)


def downgrade() -> None:
    op.drop_index('uq_warehouse_configs_short_code', table_name='warehouse_configs')
    op.drop_constraint('uq_bins_code', 'bins', type_='unique')
    op.drop_constraint('uq_racks_warehouse_name', 'racks', type_='unique')
    op.drop_constraint('uq_crates_name', 'crates', type_='unique')
