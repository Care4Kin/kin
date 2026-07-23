"""add pharmacy phone and daily pill tracking

Revision ID: 42c1918d2999
Revises: 1baa3bab0dc9
Create Date: 2026-07-20 07:03:04.591998

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '42c1918d2999'
down_revision: Union[str, None] = '1baa3bab0dc9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('prescriptions', sa.Column('pharmacy_phone', sa.Text(), nullable=True))

    op.create_table('pill_logs',
        sa.Column('log_id', sa.Integer(), nullable=False),
        sa.Column('prescription_id', sa.Integer(), nullable=False),
        sa.Column('taken_date', sa.Date(), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['prescription_id'], ['prescriptions.prescription_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('log_id'),
        sa.UniqueConstraint('prescription_id', 'taken_date', name='uq_pill_logs_prescription_date'),
    )
    op.create_index(op.f('ix_pill_logs_log_id'), 'pill_logs', ['log_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_pill_logs_log_id'), table_name='pill_logs')
    op.drop_table('pill_logs')
    op.drop_column('prescriptions', 'pharmacy_phone')
