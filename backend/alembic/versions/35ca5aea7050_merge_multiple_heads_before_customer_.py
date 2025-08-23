"""merge_multiple_heads_before_customer_update

Revision ID: 35ca5aea7050
Revises: 9f2b1c1a7c3a, a1f2e3c4, a2b3c4d5e6f7, add_unique_indexes_for_codes, c7e2a1b5d8ab
Create Date: 2025-08-21 20:06:27.252090

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '35ca5aea7050'
down_revision: Union[str, Sequence[str], None] = ('9f2b1c1a7c3a', 'a1f2e3c4', 'a2b3c4d5e6f7', 'add_unique_indexes_for_codes', 'c7e2a1b5d8ab')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
