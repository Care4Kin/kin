"""require amount on bills and monthly_cost on subscriptions

Revision ID: 99a6784bd567
Revises: 00400aba8f05
Create Date: 2026-07-08 17:42:02.681760

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '99a6784bd567'
down_revision: Union[str, None] = '00400aba8f05'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("UPDATE bills SET amount = 0 WHERE amount IS NULL")
    op.execute("UPDATE subscriptions SET monthly_cost = 0 WHERE monthly_cost IS NULL")
    op.alter_column('bills', 'amount', existing_type=sa.Numeric(10, 2), nullable=False)
    op.alter_column('subscriptions', 'monthly_cost', existing_type=sa.Numeric(10, 2), nullable=False)


def downgrade() -> None:
    op.alter_column('bills', 'amount', existing_type=sa.Numeric(10, 2), nullable=True)
    op.alter_column('subscriptions', 'monthly_cost', existing_type=sa.Numeric(10, 2), nullable=True)
