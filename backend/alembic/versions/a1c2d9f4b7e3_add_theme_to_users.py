"""add theme to users

Revision ID: a1c2d9f4b7e3
Revises: 364c98d1e1e7
Create Date: 2026-07-22 09:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1c2d9f4b7e3'
down_revision: Union[str, None] = '364c98d1e1e7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('theme', sa.String(length=30), nullable=False, server_default='sage-cream'))


def downgrade() -> None:
    op.drop_column('users', 'theme')
