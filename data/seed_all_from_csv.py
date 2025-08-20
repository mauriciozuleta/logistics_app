import csv
import os
from datetime import datetime

from app import app
from extensions import db
from models import Airport, Country, Aircraft, Trader, Route, Product, Shipment

def seed_table_from_csv(model, csv_file, field_map=None, skip_duplicates_field=None, required_csv_fields=None):
    # Add a check to ensure the seed file exists before trying to open it.
    if not os.path.exists(csv_file):
        print(f"⚠️  Warning: Seed file not found for '{model.__tablename__}', skipping. Expected at: {os.path.basename(csv_file)}")
        return

    with open(csv_file, 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        records = []
        seen = set()
        skipped = []
        for i, row in enumerate(reader, start=2):
            # New: Check for required fields before processing
            if required_csv_fields:
                missing = [f for f in required_csv_fields if not row.get(f)]
                if missing:
                    skipped.append((i, f'Missing required field(s): {", ".join(missing)}'))
                    continue

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
                # Filter the row to only include keys that are columns in the model
                model_columns = {c.name for c in model.__table__.columns}
                data = {k: v for k, v in row.items() if k in model_columns}

            for k, v in data.items():
                # Handle empty strings as None
                if isinstance(v, str) and v.strip() == '':
                    data[k] = None

                # Convert to datetime if the column type is date/datetime and value is a string
                column_type = str(getattr(model, '__table__').columns[k].type)
                if v and isinstance(v, str) and column_type.upper().startswith(('DATETIME', 'DATE')):
                    try:
                        # Use fromisoformat for ISO 8601 formats (e.g., YYYY-MM-DD HH:MM:SS)
                        data[k] = datetime.fromisoformat(v)
                    except Exception:
                        print(f"⚠️  Warning: Could not parse date '{v}' for column '{k}' in {os.path.basename(csv_file)}. Setting to None.")
                        data[k] = None
            records.append(model(**data))
        db.session.query(model).delete(synchronize_session=False)
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
                'Code': 'currency_code',
                'Region': 'region'
            },
            skip_duplicates_field='CountryCode',
            required_csv_fields=['CountryCode', 'Country', 'Code', 'Region']
        )
        seed_table_from_csv(Aircraft, os.path.join(base_dir, 'aircraft_export.csv'))
        seed_table_from_csv(Trader, os.path.join(base_dir, 'traders_export.csv'))
        # The user will create routes manually, so we skip seeding this table.
        # seed_table_from_csv(Route, os.path.join(base_dir, 'routes_export.csv'))
        seed_table_from_csv(Product, os.path.join(base_dir, 'products_export.csv'))
        # Add seeding for Airports, which is crucial for route creation
        seed_table_from_csv(Airport, os.path.join(base_dir, 'airports_export.csv'))
        # Note: Shipments are typically transactional and may not need a default seed file.
        # seed_table_from_csv(Shipment, os.path.join(base_dir, 'shipments_export.csv'))
