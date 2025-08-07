import csv
from app import app
from extensions import db
from models import Country, Aircraft, Trader, Route, Product
import os

def seed_table_from_csv(model, csv_file, field_map=None, skip_duplicates_field=None):
    with open(csv_file, 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        records = []
        seen = set()
        skipped = []
        for i, row in enumerate(reader, start=2):
            # Optionally skip duplicates
            if skip_duplicates_field:
                val = row.get(skip_duplicates_field)
                if val in seen:
                    skipped.append((i, f'Duplicate {skip_duplicates_field} "{val}"'))
                    continue
                seen.add(val)
            # Map fields if needed
            data = {field_map.get(k, k): v for k, v in row.items()} if field_map else dict(row)
            # Convert empty strings to None
            for k, v in data.items():
                if v == '':
                    data[k] = None
            records.append(model(**data))
        db.session.query(model).delete()
        db.session.bulk_save_objects(records)
        db.session.commit()
        print(f"Inserted {len(records)} records into {model.__tablename__} from {os.path.basename(csv_file)}.")
        if skipped:
            print(f"Skipped {len(skipped)} rows in {csv_file}:")
            for line, reason in skipped:
                print(f"  - Line {line}: {reason}")

def seed_all():
    with app.app_context():
        # Country
        seed_table_from_csv(Country, 'data/country-code-to-currency-code-mapping.csv',
            field_map={'CountryCode': 'country_code', 'Country': 'country_name', 'Code': 'currency_code'},
            skip_duplicates_field='CountryCode')
        # Aircraft
        seed_table_from_csv(Aircraft, 'data/aircraft_export.csv')
        # Trader
        seed_table_from_csv(Trader, 'data/traders_export.csv')
        # Route
        seed_table_from_csv(Route, 'data/routes_export.csv')
        # Product
        seed_table_from_csv(Product, 'data/products_export.csv')

if __name__ == '__main__':
    seed_all()
