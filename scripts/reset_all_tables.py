from app import app
from extensions import db

# Drop and recreate all tables
with app.app_context():
    print("Dropping all tables...")
    db.drop_all()
    print("Creating all tables...")
    db.create_all()
    print("All tables have been reset.")
