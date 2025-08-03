from app import app
from models import Airport
from extensions import db
import requests
import csv
from io import StringIO

with app.app_context():
    # Update all airports with altitude data
    airports = Airport.query.all()
    API_URL = "https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat"
    
    try:
        resp = requests.get(API_URL, timeout=10)
        if resp.ok:
            airport_data = {}
            reader = csv.reader(StringIO(resp.text))
            
            # Build lookup table
            for fields in reader:
                if len(fields) > 8:
                    iata = fields[4].strip('"').upper()
                    if iata:
                        airport_data[iata] = {
                            'latitude': float(fields[6]) if fields[6] else None,
                            'longitude': float(fields[7]) if fields[7] else None,
                            'altitude_ft': float(fields[8]) if fields[8] and fields[8] != '\\N' else None
                        }
            
            # Update airports
            for airport in airports:
                if airport.iata_code.upper() in airport_data:
                    data = airport_data[airport.iata_code.upper()]
                    airport.altitude_ft = data['altitude_ft']
                    print(f"Updated {airport.iata_code}: altitude = {airport.altitude_ft} ft")
            
            db.session.commit()
            print("All airports updated!")
            
    except Exception as e:
        print(f"Error: {e}")
