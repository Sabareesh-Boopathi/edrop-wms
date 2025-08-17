"""add inbound receipts and lines tables

Revision ID: c7e2a1b5d8ab
Revises: 8c0c0b1addac
Create Date: 2025-08-16

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision: str = 'c7e2a1b5d8ab'
down_revision: Union[str, None] = '8c0c0b1addac'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = inspect(bind)

    # Create ENUM types (idempotent)
    vendor_type_enum = postgresql.ENUM('SKU', 'FLAT', name='vendor_type_enum')
    vendor_type_enum.create(bind, checkfirst=True)

    receipt_status_enum = postgresql.ENUM(
        'AWAITING_UNLOADING',
        'UNLOADING',
        'MOVED_TO_BAY',
        'ALLOCATED',
        'READY_FOR_PICKING',
        'COMPLETED',
        'CANCELLED',
        name='inbound_receipt_status_enum'
    )
    receipt_status_enum.create(bind, checkfirst=True)

    damage_origin_enum = postgresql.ENUM('UNLOADING', 'WAREHOUSE', name='damage_origin_enum')
    damage_origin_enum.create(bind, checkfirst=True)

    # Create inbound_receipts table if missing
    if 'inbound_receipts' not in insp.get_table_names():
        op.create_table(
            'inbound_receipts',
            sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column('code', sa.String(length=64), nullable=False, unique=True),
            sa.Column('warehouse_id', postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column('vendor_id', postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column('vendor_type', postgresql.ENUM(name='vendor_type_enum', create_type=False), nullable=False, server_default='SKU'),
            sa.Column('reference', sa.String(length=128), nullable=True),
            sa.Column('planned_arrival', sa.DateTime(), nullable=True),
            sa.Column('actual_arrival', sa.DateTime(), nullable=True),
            sa.Column('status', postgresql.ENUM(name='inbound_receipt_status_enum', create_type=False), nullable=False, server_default='AWAITING_UNLOADING'),
            sa.Column('overs_policy', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
            sa.Column('notes', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
            sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
            sa.ForeignKeyConstraint(['warehouse_id'], ['warehouses.id'], ondelete='RESTRICT'),
            sa.ForeignKeyConstraint(['vendor_id'], ['vendors.id'], ondelete='RESTRICT'),
        )

    # Create indexes on inbound_receipts (skip if they already exist)
    existing_ir_indexes = {idx['name'] for idx in insp.get_indexes('inbound_receipts')} if 'inbound_receipts' in insp.get_table_names() else set()
    if 'ix_inbound_receipts_warehouse_id' not in existing_ir_indexes:
        op.create_index('ix_inbound_receipts_warehouse_id', 'inbound_receipts', ['warehouse_id'])
    if 'ix_inbound_receipts_status' not in existing_ir_indexes:
        op.create_index('ix_inbound_receipts_status', 'inbound_receipts', ['status'])

    # Create inbound_receipt_lines table if missing
    if 'inbound_receipt_lines' not in insp.get_table_names():
        op.create_table(
            'inbound_receipt_lines',
            sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column('receipt_id', postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column('product_id', postgresql.UUID(as_uuid=True), nullable=True),
            sa.Column('product_sku', sa.String(length=64), nullable=True),
            sa.Column('product_name', sa.String(length=255), nullable=True),
            sa.Column('customer_id', postgresql.UUID(as_uuid=True), nullable=True),
            sa.Column('customer_name', sa.String(length=255), nullable=True),
            sa.Column('apartment', sa.String(length=64), nullable=True),
            sa.Column('quantity', sa.Integer(), nullable=False, server_default='1'),
            sa.Column('received_qty', sa.Integer(), nullable=True),
            sa.Column('damaged', sa.Integer(), nullable=True),
            sa.Column('missing', sa.Integer(), nullable=True),
            sa.Column('ack_diff', sa.Integer(), nullable=True),
            sa.Column('damaged_origin', postgresql.ENUM(name='damage_origin_enum', create_type=False), nullable=True),
            sa.Column('bin_id', postgresql.UUID(as_uuid=True), nullable=True),
            sa.Column('notes', sa.String(length=512), nullable=True),
            sa.ForeignKeyConstraint(['receipt_id'], ['inbound_receipts.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['product_id'], ['products.id']),
            sa.ForeignKeyConstraint(['customer_id'], ['customers.id']),
            sa.ForeignKeyConstraint(['bin_id'], ['bins.id']),
        )

    existing_line_indexes = {idx['name'] for idx in insp.get_indexes('inbound_receipt_lines')} if 'inbound_receipt_lines' in insp.get_table_names() else set()
    if 'ix_inbound_receipt_lines_receipt_id' not in existing_line_indexes and 'inbound_receipt_lines' in insp.get_table_names():
        op.create_index('ix_inbound_receipt_lines_receipt_id', 'inbound_receipt_lines', ['receipt_id'])
    if 'ix_inbound_receipt_lines_bin_id' not in existing_line_indexes and 'inbound_receipt_lines' in insp.get_table_names():
        op.create_index('ix_inbound_receipt_lines_bin_id', 'inbound_receipt_lines', ['bin_id'])


def downgrade() -> None:
    # Drop tables first (dependent -> parent)
    op.drop_index('ix_inbound_receipt_lines_bin_id', table_name='inbound_receipt_lines')
    op.drop_index('ix_inbound_receipt_lines_receipt_id', table_name='inbound_receipt_lines')
    op.drop_table('inbound_receipt_lines')

    op.drop_index('ix_inbound_receipts_status', table_name='inbound_receipts')
    op.drop_index('ix_inbound_receipts_warehouse_id', table_name='inbound_receipts')
    op.drop_table('inbound_receipts')

    # Drop enums last
    damage_origin_enum = postgresql.ENUM('UNLOADING', 'WAREHOUSE', name='damage_origin_enum')
    damage_origin_enum.drop(op.get_bind(), checkfirst=True)

    receipt_status_enum = postgresql.ENUM(
        'AWAITING_UNLOADING',
        'UNLOADING',
        'MOVED_TO_BAY',
        'ALLOCATED',
        'READY_FOR_PICKING',
        'COMPLETED',
        'CANCELLED',
        name='inbound_receipt_status_enum'
    )
    receipt_status_enum.drop(op.get_bind(), checkfirst=True)

    vendor_type_enum = postgresql.ENUM('SKU', 'FLAT', name='vendor_type_enum')
    vendor_type_enum.drop(op.get_bind(), checkfirst=True)
