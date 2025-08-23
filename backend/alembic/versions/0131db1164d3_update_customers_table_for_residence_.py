"""update_customers_table_for_residence_type

Revision ID: 0131db1164d3
Revises: f8497f89770e
Create Date: 2025-08-21 20:08:30.639235

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0131db1164d3'
down_revision: Union[str, Sequence[str], None] = 'f8497f89770e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
