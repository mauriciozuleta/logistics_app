import csv
from app import app
from models import Route
from extensions import db

CSV_FILE = 'data/routes_export.csv'

def export_routes():
    with app.app_context():
        routes = Route.query.all()
        if not routes:
            print("No route records found.")
            return

        columns = [c.name for c in Route.__table__.columns]

        with open(CSV_FILE, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(columns)
            for r in routes:
                writer.writerow([getattr(r, col) for col in columns])
        print(f"Exported {len(routes)} route records to {CSV_FILE}")

if __name__ == '__main__':
    export_routes()
