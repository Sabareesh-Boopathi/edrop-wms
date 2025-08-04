"""Merge multiple heads

Revision ID: 60fbeff4edd5
Revises: 6c6db99e7a5d, 8616355dc625, add_new_fields_to_warehouse
Create Date: 2025-08-03 13:52:44.465096

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '60fbeff4edd5'
down_revision: Union[str, Sequence[str], None] = ('6c6db99e7a5d', '8616355dc625', 'add_new_fields_to_warehouse')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
