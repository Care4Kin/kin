"""add feedback messages table

Revision ID: 364c98d1e1e7
Revises: 42c1918d2999
Create Date: 2026-07-20 07:07:34.497306

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '364c98d1e1e7'
down_revision: Union[str, None] = '42c1918d2999'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('feedback_messages',
        sa.Column('message_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('message_id'),
    )
    op.create_index(op.f('ix_feedback_messages_message_id'), 'feedback_messages', ['message_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_feedback_messages_message_id'), table_name='feedback_messages')
    op.drop_table('feedback_messages')
