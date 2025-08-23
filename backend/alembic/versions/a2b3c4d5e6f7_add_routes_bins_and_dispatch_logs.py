"""add routes, route bins, associations and dispatch loading logs

Revision ID: a2b3c4d5e6f7
Revises: fdc0f1e1addc
Create Date: 2025-08-19 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql as pg

# revision identifiers, used by Alembic.
revision: str = 'a2b3c4d5e6f7'
down_revision: Union[str, Sequence[str], None] = 'fdc0f1e1addc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


route_state_enum = pg.ENUM(
    'pending', 'waiting', 'ready', 'dispatched', 'hold',
    name='route_state_enum',
    create_type=False  # prevent implicit creation; we'll guard-create via SQL
)

def upgrade() -> None:
    # Create enum type only if missing (idempotent across replays/parallel envs)
    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'route_state_enum') THEN
                CREATE TYPE route_state_enum AS ENUM ('pending', 'waiting', 'ready', 'dispatched', 'hold');
            END IF;
        END
        $$;
        """
    )

    # routes
    op.create_table(
        'routes',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('warehouse_id', sa.UUID(), nullable=True),
        sa.Column('status', route_state_enum, nullable=False, server_default='pending'),
        sa.Column('auto_slotting', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('driver_id', sa.UUID(), nullable=True),
        sa.Column('vehicle_id', sa.UUID(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['warehouse_id'], ['warehouses.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['driver_id'], ['drivers.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['vehicle_id'], ['vehicles.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_routes_name'), 'routes', ['name'], unique=False)

    # route_bins
    op.create_table(
        'route_bins',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('route_id', sa.UUID(), nullable=False),
        sa.Column('code', sa.String(length=100), nullable=False),
        sa.Column('capacity', sa.Integer(), nullable=True),
        sa.Column('locked', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.ForeignKeyConstraint(['route_id'], ['routes.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_route_bins_code'), 'route_bins', ['code'], unique=False)

    # associations
    op.create_table(
        'route_rwa_association',
        sa.Column('route_id', sa.UUID(), nullable=False),
        sa.Column('rwa_id', sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(['route_id'], ['routes.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['rwa_id'], ['rwas.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('route_id', 'rwa_id')
    )

    op.create_table(
        'route_bin_crates',
        sa.Column('route_bin_id', sa.UUID(), nullable=False),
        sa.Column('crate_id', sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(['route_bin_id'], ['route_bins.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['crate_id'], ['crates.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('route_bin_id', 'crate_id')
    )

    # dispatch loading logs
    op.create_table(
        'dispatch_loading_logs',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('route_id', sa.UUID(), nullable=False),
        sa.Column('ts', sa.DateTime(), nullable=False),
        sa.Column('crate_id', sa.UUID(), nullable=True),
        sa.Column('tote_code', sa.String(length=255), nullable=True),
        sa.Column('ok', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('note', sa.String(length=500), nullable=True),
        sa.ForeignKeyConstraint(['route_id'], ['routes.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['crate_id'], ['crates.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('dispatch_loading_logs')
    op.drop_table('route_bin_crates')
    op.drop_table('route_rwa_association')
    op.drop_index(op.f('ix_route_bins_code'), table_name='route_bins')
    op.drop_table('route_bins')
    op.drop_index(op.f('ix_routes_name'), table_name='routes')
    op.drop_table('routes')
    # Drop enum type if exists (after dropping dependent tables)
    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'route_state_enum') THEN
                DROP TYPE route_state_enum;
            END IF;
        END
        $$;
        """
    )
