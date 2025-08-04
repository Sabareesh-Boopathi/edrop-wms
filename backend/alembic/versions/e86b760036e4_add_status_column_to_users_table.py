"""Add status column to users table

Revision ID: e86b760036e4
Revises: a2c63d4d9d33
Create Date: 2025-08-04 06:21:34.902247

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e86b760036e4'
down_revision: Union[str, Sequence[str], None] = 'a2c63d4d9d33'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('users', sa.Column('status', sa.String(length=50), nullable=False, server_default='ACTIVE'))
    op.execute("UPDATE users SET status = 'ACTIVE' WHERE status IS NULL")

def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('users', 'status')
