import csv
from app import app
from models import Trader
from extensions import db

CSV_FILE = 'data/traders_export.csv'

def export_traders():
    with app.app_context():
        traders = Trader.query.all()
        if not traders:
            print("No trader records found.")
            return

        columns = [c.name for c in Trader.__table__.columns]

        with open(CSV_FILE, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(columns)
            for t in traders:
                writer.writerow([getattr(t, col) for col in columns])
        print(f"Exported {len(traders)} trader records to {CSV_FILE}")

if __name__ == '__main__':
    export_traders()
