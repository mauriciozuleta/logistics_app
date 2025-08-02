import math
from models import Airport

def get_airport_coordinates_db(iata_code):
    airport = Airport.query.filter_by(iata_code=iata_code).first()
    if airport and airport.latitude is not None and airport.longitude is not None:
        return airport.latitude, airport.longitude
    return None

def calculate_distance_db(origin_iata, destination_iata):
    coords1 = get_airport_coordinates_db(origin_iata)
    coords2 = get_airport_coordinates_db(destination_iata)
    if not coords1 or not coords2:
        return None
    lat1, lon1 = map(math.radians, coords1)
    lat2, lon2 = map(math.radians, coords2)
    delta_lat = lat2 - lat1
    delta_lon = lon2 - lon1
    a = math.sin(delta_lat / 2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(delta_lon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    earth_radius_nm = 3440.065
    return round(earth_radius_nm * c, 2)
