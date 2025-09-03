from app import app
from models import Trader

with app.app_context():
    traders = Trader.query.all()
    for t in traders:
        print({
            'id': t.id,
            'name': t.name,
            'city': t.city,
            'country_id': t.country_id,
            'region': t.region,
            'is_manager': t.is_manager
        })
