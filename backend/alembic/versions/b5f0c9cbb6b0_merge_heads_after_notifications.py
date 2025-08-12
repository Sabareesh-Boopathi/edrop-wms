"""merge heads after notifications

Revision ID: b5f0c9cbb6b0
Revises: 8a2f0bc59b15, a9a7d2d9c1a1
Create Date: 2025-08-09 08:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'b5f0c9cbb6b0'
down_revision: Union[str, Sequence[str], None] = ('8a2f0bc59b15', 'a9a7d2d9c1a1')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
