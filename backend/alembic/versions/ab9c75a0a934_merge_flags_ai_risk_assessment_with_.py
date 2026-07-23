"""merge flags ai risk assessment with full redesign

Revision ID: ab9c75a0a934
Revises: f2d4be7d57a5, c43e70df2876
Create Date: 2026-07-23 15:12:25.028256

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ab9c75a0a934'
down_revision: Union[str, None] = ('f2d4be7d57a5', 'c43e70df2876')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
