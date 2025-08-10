"""Add product_code to Product

Revision ID: 5778cfbb38c4
Revises: a1be831d5a26
Create Date: 2025-08-09 21:49:22.035129

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '5778cfbb38c4'
down_revision = 'a1be831d5a26'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('products', sa.Column('product_code', sa.String(length=16), nullable=False, server_default=''))

def downgrade():
    op.drop_column('products', 'product_code')
