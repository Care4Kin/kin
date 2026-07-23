"""add schedule_days to prescriptions

Revision ID: f2e8a1c93b6d
Revises: a1c2d9f4b7e3
Create Date: 2026-07-23 09:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f2e8a1c93b6d'
down_revision: Union[str, None] = 'a1c2d9f4b7e3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('prescriptions', sa.Column('schedule_days', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('prescriptions', 'schedule_days')
