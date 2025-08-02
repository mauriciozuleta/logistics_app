from app import app
from extensions import db
from models import Airport

# Drop and recreate only the Airport table
with app.app_context():
    print("Dropping airport table...")
    Airport.__table__.drop(db.engine)
    print("Creating airport table...")
    Airport.__table__.create(db.engine)
    print("Airport table reset complete.")
