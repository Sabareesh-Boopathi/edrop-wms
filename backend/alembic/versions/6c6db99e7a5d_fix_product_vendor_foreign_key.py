"""Fix_product_vendor_foreign_key

Revision ID: 6c6db99e7a5d
Revises: cfcce025c785
Create Date: 2025-07-24 13:15:48.761977

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6c6db99e7a5d'
down_revision: Union[str, Sequence[str], None] = 'cfcce025c785'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column('products', 'sku',
               existing_type=sa.VARCHAR(length=100),
               nullable=False)
    op.drop_index(op.f('ix_products_sku'), table_name='products')
    op.create_unique_constraint(None, 'products', ['sku'])
    op.drop_constraint(op.f('products_vendor_id_fkey'), 'products', type_='foreignkey')
    op.create_foreign_key(None, 'products', 'vendors', ['vendor_id'], ['id'])
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_constraint(None, 'products', type_='foreignkey')
    op.create_foreign_key(op.f('products_vendor_id_fkey'), 'products', 'users', ['vendor_id'], ['id'])
    op.drop_constraint(None, 'products', type_='unique')
    op.create_index(op.f('ix_products_sku'), 'products', ['sku'], unique=True)
    op.alter_column('products', 'sku',
               existing_type=sa.VARCHAR(length=100),
               nullable=True)
    # ### end Alembic commands ###
