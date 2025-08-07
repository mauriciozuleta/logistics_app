import csv
from app import app
from models import Aircraft
from extensions import db

CSV_FILE = 'data/aircraft_export.csv'

def export_aircraft():
    with app.app_context():
        aircraft_list = Aircraft.query.all()
        if not aircraft_list:
            print("No aircraft records found.")
            return

        columns = [c.name for c in Aircraft.__table__.columns]

        with open(CSV_FILE, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(columns)
            for ac in aircraft_list:
                writer.writerow([getattr(ac, col) for col in columns])
        print(f"Exported {len(aircraft_list)} aircraft records to {CSV_FILE}")

if __name__ == '__main__':
    export_aircraft()
