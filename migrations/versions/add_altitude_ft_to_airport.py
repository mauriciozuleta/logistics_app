"""
Add altitude_ft column to Airport table
"""
from alembic import op
import sqlalchemy as sa

def upgrade():
    op.add_column('airports', sa.Column('altitude_ft', sa.Float(), nullable=True))

def downgrade():
    op.drop_column('airports', 'altitude_ft')
