"""add product_id to discount

Revision ID: d55ac55a0b6f
Revises: 190bc061886c
Create Date: 2026-05-19 18:24:09.089580

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd55ac55a0b6f'
down_revision: Union[str, Sequence[str], None] = '190bc061886c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table('discounts', schema=None) as batch_op:
        batch_op.add_column(sa.Column('product_id', sa.Integer(), nullable=True))
        batch_op.create_foreign_key('fk_discounts_product_id', 'products', ['product_id'], ['id'])



def downgrade() -> None:
    """Downgrade schema."""
    
    with op.batch_alter_table('discounts', schema=None) as batch_op:
        batch_op.drop_constraint('fk_discounts_product_id', type_='foreignkey')
        batch_op.drop_column('product_id')
