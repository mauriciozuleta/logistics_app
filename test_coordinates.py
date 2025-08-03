#!/usr/bin/env python3
"""
Test script to verify the airport coordinates fetching logic
"""
import requests
import csv
from io import StringIO

def fetch_airport_coordinates(iata_code):
    """
    Fetch airport coordinates using OpenFlights data
    Returns: (latitude, longitude, airport_name) or (None, None, None) if not found
    """
    iata = iata_code.strip().upper()
    latitude = None
    longitude = None
    airport_name = None
    
    if iata and len(iata) == 3:
        API_URL = "https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat"
        try:
            print(f"Fetching data for IATA code: {iata}")
            resp = requests.get(API_URL, timeout=10)
            if resp.ok:
                reader = csv.reader(StringIO(resp.text))
                for fields in reader:
                    if len(fields) > 7 and fields[4].strip('"').upper() == iata:
                        try:
                            airport_name = fields[1].strip('"')
                            latitude = float(fields[6])
                            longitude = float(fields[7])
                            print(f"Found: {airport_name} - Lat: {latitude}, Lon: {longitude}")
                            break
                        except Exception as e:
                            print(f"Error parsing coordinates: {e}")
                            latitude = None
                            longitude = None
                            break
                if latitude is None:
                    print(f"Airport with IATA code {iata} not found in OpenFlights database")
            else:
                print(f"Failed to fetch data from OpenFlights. Status code: {resp.status_code}")
        except Exception as e:
            print(f"Error fetching coordinates: {e}")
            latitude = None
            longitude = None
    else:
        print(f"Invalid IATA code: {iata} (must be 3 characters)")
    
    return latitude, longitude, airport_name

if __name__ == "__main__":
    # Test with some common airport codes
    test_codes = ["JFK", "LAX", "CDG", "LHR", "DXB", "MDE", "BOG", "MIA", "XYZ"]
    
    for code in test_codes:
        print(f"\n--- Testing {code} ---")
        lat, lon, name = fetch_airport_coordinates(code)
        if lat and lon:
            print(f"✅ Success: {name} ({code}) - {lat}, {lon}")
        else:
            print(f"❌ Failed: {code} - No coordinates found")
