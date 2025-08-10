import csv
import os
import sys
from datetime import datetime

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app import app
from extensions import db
from models import Country, Aircraft, Trader, Route, Product

def seed_table_from_csv(model, csv_file, field_map=None, skip_duplicates_field=None):
    with open(csv_file, 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        records = []
        seen = set()
        skipped = []
        for i, row in enumerate(reader, start=2):
            if skip_duplicates_field:
                val = row.get(skip_duplicates_field)
                if val in seen:
                    skipped.append((i, f'Duplicate {skip_duplicates_field} "{val}"'))
                    continue
                seen.add(val)
            # Only use fields that are mapped (for field_map) or that exist in the model
            if field_map:
                data = {field_map[k]: v for k, v in row.items() if k in field_map}
            else:
                data = dict(row)
            for k, v in data.items():
                if v == '':
                    data[k] = None
                # Convert to datetime if the model has this attribute and it's not None
                elif (
                    k in getattr(model, '__table__').columns and
                    str(getattr(model, '__table__').columns[k].type).upper().startswith('DATETIME') and
                    v is not None
                ):
                    try:
                        data[k] = datetime.fromisoformat(v)
                    except Exception:
                        data[k] = None  # or handle as needed
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
    base_dir = os.path.dirname(__file__)
    with app.app_context():
        seed_table_from_csv(
            Country,
            os.path.join(base_dir, 'country-code-to-currency-code-mapping.csv'),
            field_map={
                'CountryCode': 'country_code',
                'Country': 'country_name',
                # 'Currency': not mapped, since not in model
                'Code': 'currency_code'
            },
            skip_duplicates_field='CountryCode'
        )
        seed_table_from_csv(Aircraft, os.path.join(base_dir, 'aircraft_export.csv'))
        seed_table_from_csv(Trader, os.path.join(base_dir, 'traders_export.csv'))
        seed_table_from_csv(Route, os.path.join(base_dir, 'routes_export.csv'))
        seed_table_from_csv(Product, os.path.join(base_dir, 'products_export.csv'))

if __name__ == '__main__':
    seed_all()