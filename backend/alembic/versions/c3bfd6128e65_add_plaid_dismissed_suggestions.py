"""add plaid dismissed suggestions

Revision ID: c3bfd6128e65
Revises: 64a23696d067
Create Date: 2026-08-04 15:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c3bfd6128e65'
down_revision: Union[str, None] = '64a23696d067'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'plaid_dismissed_suggestions',
        sa.Column('dismissed_suggestion_id', sa.Integer(), primary_key=True),
        sa.Column('circle_id', sa.Integer(), sa.ForeignKey('family_circles.circle_id', ondelete='CASCADE'), nullable=False),
        sa.Column('source_key', sa.Text(), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.func.now()),
        sa.UniqueConstraint('circle_id', 'source_key', name='uq_plaid_dismissed_suggestion_circle_source'),
    )


def downgrade() -> None:
    op.drop_table('plaid_dismissed_suggestions')
