"""Sync user schema with database

Revision ID: 3327a6bc7e18
Revises: 4ae9144900c5
Create Date: 2025-08-04 06:44:45.750842

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3327a6bc7e18'
down_revision: Union[str, Sequence[str], None] = '4ae9144900c5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # add last_login if missing; do not re-add status
    with op.batch_alter_table('users') as batch_op:
        batch_op.add_column(sa.Column('last_login', sa.DateTime(timezone=True), nullable=True))
    # if an is_active column exists from older bases, drop it safely
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    cols = [c['name'] for c in inspector.get_columns('users')]
    if 'is_active' in cols:
        with op.batch_alter_table('users') as batch_op:
            batch_op.drop_column('is_active')


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('users') as batch_op:
        batch_op.drop_column('last_login')
    # do not restore is_active/status automatically
