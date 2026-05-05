"""add user role

Revision ID: b1c2d3e4f5a6
Revises: 23afa24f8a00
Create Date: 2026-05-05 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'b1c2d3e4f5a6'
down_revision: Union[str, None] = '23afa24f8a00'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('role', sa.String(length=20), nullable=False, server_default='consumer'))


def downgrade() -> None:
    op.drop_column('users', 'role')
