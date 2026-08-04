"""add has_seen_onboarding to users

Revision ID: ffb1ee2f5237
Revises: 64a23696d067
Create Date: 2026-08-04 15:51:21.405468

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ffb1ee2f5237'
down_revision: Union[str, None] = '64a23696d067'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('has_seen_onboarding', sa.Boolean(), nullable=False, server_default='true'))


def downgrade() -> None:
    op.drop_column('users', 'has_seen_onboarding')
