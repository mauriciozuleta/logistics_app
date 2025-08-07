import csv
from app import app
from models import Product
from extensions import db

CSV_FILE = 'data/products_export.csv'

def export_products():
    with app.app_context():
        products = Product.query.all()
        if not products:
            print("No product records found.")
            return

        columns = [c.name for c in Product.__table__.columns]

        with open(CSV_FILE, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(columns)
            for p in products:
                writer.writerow([getattr(p, col) for col in columns])
        print(f"Exported {len(products)} product records to {CSV_FILE}")

if __name__ == '__main__':
    export_products()
