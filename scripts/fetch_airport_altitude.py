import requests
import csv
from io import StringIO
from models import Airport
from extensions import db

def fetch_altitude(iata_code):
    API_URL = "https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat"
    try:
        resp = requests.get(API_URL, timeout=10)
        if resp.ok:
            reader = csv.reader(StringIO(resp.text))
            for fields in reader:
                if len(fields) > 8 and fields[4].strip('"').upper() == iata_code.upper():
                    try:
                        altitude_ft = float(fields[8])
                        return altitude_ft
                    except Exception:
                        return None
    except Exception:
        return None
    return None

def update_airport_altitudes():
    airports = Airport.query.all()
    for airport in airports:
        altitude = fetch_altitude(airport.iata_code)
        if altitude is not None:
            airport.altitude_ft = altitude
            print(f"Updated {airport.name} ({airport.iata_code}): {altitude} ft")
    db.session.commit()

if __name__ == "__main__":
    update_airport_altitudes()
    print("All airport altitudes updated.")
