"""merge heads after rack/bin tables

Revision ID: 8a2f0bc59b15
Revises: 44fc2339e62b, 8c0c0b1addac
Create Date: 2025-08-08 19:55:03.531046

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8a2f0bc59b15'
down_revision: Union[str, Sequence[str], None] = ('44fc2339e62b', '8c0c0b1addac')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
