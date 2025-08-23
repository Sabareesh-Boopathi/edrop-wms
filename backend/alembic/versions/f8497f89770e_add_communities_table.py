"""add_communities_table

Revision ID: f8497f89770e
Revises: 35ca5aea7050
Create Date: 2025-08-21 20:06:54.681442

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f8497f89770e'
down_revision: Union[str, Sequence[str], None] = '35ca5aea7050'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
