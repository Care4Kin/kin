"""add phone verification and google sso fields to users

Revision ID: 773977aec681
Revises: 99a6784bd567
Create Date: 2026-07-08 17:45:34.477069

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '773977aec681'
down_revision: Union[str, None] = '99a6784bd567'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('phone_verified', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('users', sa.Column('phone_verification_code_hash', sa.Text(), nullable=True))
    op.add_column('users', sa.Column('phone_verification_expires_at', sa.TIMESTAMP(timezone=True), nullable=True))
    op.add_column('users', sa.Column('google_sub', sa.Text(), nullable=True))
    op.create_unique_constraint('uq_users_google_sub', 'users', ['google_sub'])


def downgrade() -> None:
    op.drop_constraint('uq_users_google_sub', 'users', type_='unique')
    op.drop_column('users', 'google_sub')
    op.drop_column('users', 'phone_verification_expires_at')
    op.drop_column('users', 'phone_verification_code_hash')
    op.drop_column('users', 'phone_verified')
