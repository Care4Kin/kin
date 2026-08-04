"""add resolution note to flags

Revision ID: 4eadf41e9430
Revises: 1ce5c6e50907
Create Date: 2026-08-04 13:09:09.504573

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4eadf41e9430'
down_revision: Union[str, None] = '1ce5c6e50907'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('flags', sa.Column('resolution_note', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('flags', 'resolution_note')
