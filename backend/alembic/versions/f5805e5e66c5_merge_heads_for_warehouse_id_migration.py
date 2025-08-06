"""Merge heads for warehouse_id migration

Revision ID: f5805e5e66c5
Revises: 3327a6bc7e18, add_warehouse_id_to_users
Create Date: 2025-08-04 18:12:08.861821

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f5805e5e66c5'
down_revision: Union[str, Sequence[str], None] = ('3327a6bc7e18', 'add_warehouse_id_to_users')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
