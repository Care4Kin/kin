"""add subscriptions and appointments permissions to circle members and invitations

Revision ID: 64a23696d067
Revises: 4eadf41e9430
Create Date: 2026-08-04 14:49:50.480300

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '64a23696d067'
down_revision: Union[str, None] = '4eadf41e9430'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('circle_members', sa.Column('can_view_subscriptions', sa.Boolean(), nullable=True, server_default='true'))
    op.add_column('circle_members', sa.Column('can_view_appointments', sa.Boolean(), nullable=True, server_default='true'))
    op.add_column('circle_invitations', sa.Column('can_view_subscriptions', sa.Boolean(), nullable=True, server_default='true'))
    op.add_column('circle_invitations', sa.Column('can_view_appointments', sa.Boolean(), nullable=True, server_default='true'))


def downgrade() -> None:
    op.drop_column('circle_invitations', 'can_view_appointments')
    op.drop_column('circle_invitations', 'can_view_subscriptions')
    op.drop_column('circle_members', 'can_view_appointments')
    op.drop_column('circle_members', 'can_view_subscriptions')
