import requests
import csv
from io import StringIO

# Test the OpenFlights data format
API_URL = "https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat"

try:
    resp = requests.get(API_URL, timeout=10)
    if resp.ok:
        reader = csv.reader(StringIO(resp.text))
        # Get first few lines to understand the format
        for i, fields in enumerate(reader):
            if i < 5:  # Show first 5 lines
                print(f"Line {i+1}: {len(fields)} fields")
                for j, field in enumerate(fields):
                    print(f"  Field {j}: {field}")
                print()
            if i >= 4:
                break
    else:
        print(f"Failed to fetch data: {resp.status_code}")
except Exception as e:
    print(f"Error: {e}")
