"""add status column to racks

Revision ID: add_status_to_racks_table
Revises: b5f0c9cbb6b0
Create Date: 2025-08-09

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'add_status_to_racks_table'
down_revision: Union[str, None] = 'b5f0c9cbb6b0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    with op.batch_alter_table('racks') as batch_op:
        batch_op.add_column(sa.Column('status', sa.String(length=50), nullable=False, server_default='active'))
    # remove server_default after backfilling existing rows
    with op.batch_alter_table('racks') as batch_op:
        batch_op.alter_column('status', server_default=None)


def downgrade() -> None:
    with op.batch_alter_table('racks') as batch_op:
        batch_op.drop_column('status')
