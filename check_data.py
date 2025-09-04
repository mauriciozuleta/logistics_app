from app import app
from models import Country, Region

with app.app_context():
    print('Country regions sample:', [f'{c.country_name}: region={c.region}' for c in Country.query.limit(5)])
    print('Regions:', [f'{r.id}: {r.name}' for r in Region.query.all()])
    print('Region name to ID mapping:', {r.name: r.id for r in Region.query.all()})
    
    # Get countries with region South-Central America (ID 1)
    south_central_america_countries = Country.query.filter_by(region='South-Central America').count()
    print(f'Countries in South-Central America: {south_central_america_countries}')
    
    # Get countries with region North America (ID 2)
    north_america_countries = Country.query.filter_by(region='North America').count()
    print(f'Countries in North America: {north_america_countries}')
