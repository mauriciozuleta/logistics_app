from app import app
from models import Airport

with app.app_context():
    airports = Airport.query.all()
    print('Current airports:')
    for a in airports:
        alt = getattr(a, 'altitude_ft', 'N/A')
        print(f'{a.iata_code}: lat={a.latitude}, lon={a.longitude}, alt={alt}')
