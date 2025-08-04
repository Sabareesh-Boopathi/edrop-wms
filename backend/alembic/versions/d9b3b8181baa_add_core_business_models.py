"""Add core business models

Revision ID: d9b3b8181baa
Revises: 2959472d4a47
Create Date: 2025-07-23 06:40:51.666258

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = 'd9b3b8181baa'
down_revision: Union[str, Sequence[str], None] = '6e0e74e00f41'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    inspector = inspect(op.get_bind())
    tables = inspector.get_table_names()
    indexes_rwas = inspector.get_indexes('rwas') if 'rwas' in tables else []
    indexes_warehouses = inspector.get_indexes('warehouses') if 'warehouses' in tables else []

    index_names_rwas = [index['name'] for index in indexes_rwas]
    index_names_warehouses = [index['name'] for index in indexes_warehouses]

    if 'rwas' not in tables:
        op.create_table('rwas',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('city', sa.String(length=100), nullable=False),
        sa.PrimaryKeyConstraint('id')
        )

    if 'ix_rwas_name' not in index_names_rwas:
        op.create_index(op.f('ix_rwas_name'), 'rwas', ['name'], unique=False)
    if 'flats' not in tables:
        op.create_table('flats',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=True),
        sa.Column('tower_block', sa.String(length=50), nullable=True),
        sa.Column('flat_number', sa.String(length=50), nullable=False),
        sa.Column('rwa_id', sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(['rwa_id'], ['rwas.id'], name=op.f('fk_flats_rwa_id_rwas')),
        sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_flats_name'), 'flats', ['name'], unique=False)
    if 'products' not in tables:
        op.create_table('products',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('sku', sa.String(length=100), nullable=True),
        sa.Column('price', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('vendor_id', sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(['vendor_id'], ['users.id'], name=op.f('fk_products_vendor_id_users')),
        sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_products_name'), 'products', ['name'], unique=False)
        op.create_index(op.f('ix_products_sku'), 'products', ['sku'], unique=True)
    op.create_table('vendor_profiles',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('business_name', sa.String(length=255), nullable=False),
    sa.Column('address', sa.Text(), nullable=True),
    sa.Column('latitude', sa.Numeric(precision=10, scale=7), nullable=True),
    sa.Column('longitude', sa.Numeric(precision=10, scale=7), nullable=True),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], name=op.f('fk_vendor_profiles_user_id_users')),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('user_id')
    )
    op.create_index(op.f('ix_vendor_profiles_business_name'), 'vendor_profiles', ['business_name'], unique=False)
    if 'warehouses' not in tables:
        op.create_table('warehouses',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('city', sa.String(length=100), nullable=False),
        sa.Column('latitude', sa.Numeric(precision=10, scale=7), nullable=True),
        sa.Column('longitude', sa.Numeric(precision=10, scale=7), nullable=True),
        sa.Column('manager_id', sa.UUID(), nullable=True),
        sa.ForeignKeyConstraint(['manager_id'], ['users.id'], name=op.f('fk_warehouses_manager_id_users')),
        sa.PrimaryKeyConstraint('id')
        )
    if 'ix_warehouses_name' not in index_names_warehouses:
        op.create_index(op.f('ix_warehouses_name'), 'warehouses', ['name'], unique=False)
    if 'customers' not in tables:
        op.create_table('customers',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('phone_number', sa.String(length=50), nullable=True),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('flat_id', sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(['flat_id'], ['flats.id'], name=op.f('fk_customers_flat_id_flats')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name=op.f('fk_customers_user_id_users')),
        sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_customers_phone_number'), 'customers', ['phone_number'], unique=True)
    if 'orders' not in tables:
        op.create_table('orders',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('total_amount', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('customer_id', sa.UUID(), nullable=False),
        sa.Column('warehouse_id', sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(['customer_id'], ['customers.id'], name=op.f('fk_orders_customer_id_customers')),
        sa.ForeignKeyConstraint(['warehouse_id'], ['warehouses.id'], name=op.f('fk_orders_warehouse_id_warehouses')),
        sa.PrimaryKeyConstraint('id')
        )
    if 'order_products' not in tables:
        op.create_table('order_products',
        sa.Column('order_id', sa.UUID(), nullable=False),
        sa.Column('product_id', sa.UUID(), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ),
        sa.PrimaryKeyConstraint('order_id', 'product_id')
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('order_products')
    op.drop_table('orders')
    op.drop_index(op.f('ix_customers_phone_number'), table_name='customers')
    op.drop_table('customers')
    op.drop_index(op.f('ix_warehouses_name'), table_name='warehouses')
    op.drop_table('warehouses')
    op.drop_index(op.f('ix_vendor_profiles_business_name'), table_name='vendor_profiles')
    op.drop_table('vendor_profiles')
    op.drop_index(op.f('ix_products_sku'), table_name='products')
    op.drop_index(op.f('ix_products_name'), table_name='products')
    op.drop_table('products')
    op.drop_index(op.f('ix_flats_name'), table_name='flats')
    op.drop_table('flats')
    op.drop_index(op.f('ix_rwas_name'), table_name='rwas')
    op.drop_table('rwas')
    # ### end Alembic commands ###
