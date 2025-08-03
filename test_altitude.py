from app import app
from models import Airport
from extensions import db
import requests
import csv
from io import StringIO

with app.app_context():
    # Test the altitude fetching for MIA airport
    iata = "MIA"
    API_URL = "https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat"
    
    try:
        resp = requests.get(API_URL, timeout=10)
        if resp.ok:
            reader = csv.reader(StringIO(resp.text))
            for fields in reader:
                if len(fields) > 8 and fields[4].strip('"').upper() == iata:
                    print(f"Found {iata}:")
                    print(f"  Latitude: {fields[6]}")
                    print(f"  Longitude: {fields[7]}")
                    print(f"  Altitude: {fields[8]} ft")
                    
                    # Update the MIA airport with altitude
                    airport = Airport.query.filter_by(iata_code=iata).first()
                    if airport:
                        airport.altitude_ft = float(fields[8]) if fields[8] and fields[8] != '\\N' else None
                        db.session.commit()
                        print(f"Updated {iata} altitude to {airport.altitude_ft} ft")
                    break
    except Exception as e:
        print(f"Error: {e}")
