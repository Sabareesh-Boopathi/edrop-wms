"""Allow extend_existing on Store

Revision ID: 44fc2339e62b
Revises: e068a58ad49e
Create Date: 2025-08-06 18:33:00.644226

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '44fc2339e62b'
down_revision: Union[str, Sequence[str], None] = 'e068a58ad49e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema.
    NOTE: Original auto-generated migration erroneously dropped store_products.
    This has been converted to a no-op to preserve the table and avoid breaking FKs in later revisions.
    """
    pass


def downgrade() -> None:
    """Downgrade schema."""
    # Leave downgrade as-is or as a no-op depending on your policy.
    # To be safe, make this a no-op as well to avoid accidental drops during downgrades.
    pass
