"""
Add warehouse_id column to users table
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_warehouse_id_to_users'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('users', sa.Column('warehouse_id', sa.UUID(), sa.ForeignKey('warehouses.id'), nullable=True))

def downgrade():
    op.drop_column('users', 'warehouse_id')