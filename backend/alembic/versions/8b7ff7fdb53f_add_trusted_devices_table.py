"""add trusted devices table

Revision ID: 8b7ff7fdb53f
Revises: 6b47c95fba4a
Create Date: 2026-08-12 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8b7ff7fdb53f'
down_revision: Union[str, None] = '6b47c95fba4a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'trusted_devices',
        sa.Column('trusted_device_id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False),
        sa.Column('device_id', sa.Text(), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.func.now()),
        sa.UniqueConstraint('user_id', 'device_id', name='uq_trusted_device_user_device'),
    )


def downgrade() -> None:
    op.drop_table('trusted_devices')
