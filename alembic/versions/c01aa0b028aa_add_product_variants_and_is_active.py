"""add_product_variants_and_is_active

Revision ID: c01aa0b028aa
Revises: d55ac55a0b6f
Create Date: 2026-05-20 14:25:23.442805

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c01aa0b028aa'
down_revision: Union[str, Sequence[str], None] = 'd55ac55a0b6f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Добавляем is_active в products
    with op.batch_alter_table('products', schema=None) as batch_op:
        batch_op.add_column(sa.Column('is_active', sa.Boolean(), nullable=True, server_default=sa.text('1')))

    # Создаём таблицу product_variants
    op.create_table('product_variants',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('product_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('variant_type', sa.String(), nullable=True),
        sa.Column('value', sa.String(), nullable=True),
        sa.Column('price', sa.Float(), nullable=True),
        sa.Column('stock', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True, server_default=sa.text('1')),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('product_variants', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_product_variants_id'), ['id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('product_variants', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_product_variants_id'))

    op.drop_table('product_variants')

    with op.batch_alter_table('products', schema=None) as batch_op:
        batch_op.drop_column('is_active')
