"""merge onboarding flag with plaid dismissed suggestions

Revision ID: 6b47c95fba4a
Revises: c3bfd6128e65, ffb1ee2f5237
Create Date: 2026-08-04 16:09:07.150048

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6b47c95fba4a'
down_revision: Union[str, None] = ('c3bfd6128e65', 'ffb1ee2f5237')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
