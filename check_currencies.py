from app import app
from models import Country

with app.app_context():
    print('First 5 countries with currency codes:')
    for country in Country.query.limit(5).all():
        print(f'{country.country_code}: {country.country_name} - Currency: {country.currency_code}')