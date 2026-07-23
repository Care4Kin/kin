"""merge digest-frequency (dev) with theme + schedule-days (feature/full-redesign)

Revision ID: c43e70df2876
Revises: 5b8d590e3394, f2e8a1c93b6d
Create Date: 2026-07-23 14:49:35.203807

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c43e70df2876'
down_revision: Union[str, None] = ('5b8d590e3394', 'f2e8a1c93b6d')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
