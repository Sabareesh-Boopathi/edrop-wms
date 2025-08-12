"""Add status column to users table

Revision ID: 4ae9144900c5
Revises: 2d6954521509
Create Date: 2025-08-04 06:41:10.705750

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4ae9144900c5'
down_revision: Union[str, Sequence[str], None] = '2d6954521509'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """No-op: status was added in a previous revision (e86b760036e4)."""
    pass


def downgrade() -> None:
    """No-op to avoid dropping existing status column."""
    pass
