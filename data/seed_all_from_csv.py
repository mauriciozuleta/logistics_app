import csv
import os
import sys
from datetime import datetime

# Ensure project root is in sys.path for imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app import create_app
app = create_app()
from extensions import db
from models import Airport, Country, Aircraft, Route, Product, Shipment

def seed_table_from_csv(model, csv_file, field_map=None, skip_duplicates_field=None, required_csv_fields=None):
    # Add a check to ensure the seed file exists before trying to open it.
    print(f"Seeding table: {model.__tablename__} from {csv_file}")
    if not os.path.exists(csv_file):
        print(f"⚠️  Warning: Seed file not found for '{model.__tablename__}', skipping. Expected at: {os.path.basename(csv_file)}")
        return

    with open(csv_file, 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        records = []
        seen = set()
        skipped = []
        row_count = 0
        for i, row in enumerate(reader, start=2):
            row_count += 1
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
        print(f"Read {row_count} rows from {csv_file}. Prepared {len(records)} records for {model.__tablename__}.")
        try:
            db.session.query(model).delete(synchronize_session=False)
            db.session.bulk_save_objects(records)
            db.session.commit()
            print(f"Inserted {len(records)} records into {model.__tablename__} from {os.path.basename(csv_file)}.")
        except Exception as e:
            print(f"❌ Error inserting records into {model.__tablename__}: {e}")
        if skipped:
            print(f"Skipped {len(skipped)} rows in {csv_file}:")
            for line, reason in skipped:
                print(f"  - Line {line}: {reason}")

def seed_all():
    # Seed Countries
    seed_table_from_csv(
        Country,
        os.path.join('data', 'country-code-to-currency-code-mapping.csv'),
        field_map={
            'CountryCode': 'country_code',
            'Country': 'country_name',
            'Code': 'currency_code',
            'Region': 'region',
        },
        skip_duplicates_field='CountryCode',
        required_csv_fields=['CountryCode', 'Country', 'Code']
    )

    # Seed Products
    seed_table_from_csv(
        Product,
        os.path.join('data', 'products_export.csv'),
        field_map={
            'product_code': 'product_code',
            'product_type': 'product_type',
            'name': 'name',
            'country_id': 'country_id',
            'trade_unit': 'trade_unit',
            'fca_cost_per_wu': 'fca_cost_per_wu',
            'packaging': 'packaging',
            'packaging_weight': 'packaging_weight',
            'units_per_pack': 'units_per_pack',
            'packaging_cost': 'packaging_cost',
            'other_info': 'other_info',
            'currency': 'currency',
        },
        skip_duplicates_field='product_code',
        required_csv_fields=['product_code', 'name', 'country_id']
    )

    # Seed Aircraft
    seed_table_from_csv(
        Aircraft,
        os.path.join('data', 'aircraft_export.csv'),
        skip_duplicates_field='id',
        required_csv_fields=['id', 'manufacturer', 'model']
    )

    # Seed Airports
    seed_table_from_csv(
        Airport,
        os.path.join('data', 'airports_export.csv'),
        skip_duplicates_field='iata_code',
        required_csv_fields=['iata_code', 'name', 'city', 'country_id']
    )

    # You can add more seeding calls for other tables as needed
    print('Seeding complete.')

# Run seeding if executed directly
if __name__ == "__main__":
    with app.app_context():
        seed_all()
