import csv
from app import app
from extensions import db
from models import Country

def seed_countries_from_csv():
    with app.app_context():
        # 🔄 Step 1: Clear existing entries
        deleted = db.session.query(Country).delete()
        db.session.commit()
        print(f"✔️ Deleted {deleted} existing country records.")

        # 📥 Step 2: Load and filter rows
        with open('data/country-code-to-currency-code-mapping.csv', 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            countries = []
            seen_codes = set()
            skipped = []

            for i, row in enumerate(reader, start=2):  # start=2 assumes header is line 1
                code = row.get('CountryCode')
                name = row.get('Country')
                currency = row.get('Code')

                # 🚫 Skip if any required field is missing or if code already used
                if not code or not name or not currency:
                    skipped.append((i, 'Missing field(s)'))
                    continue
                if code in seen_codes:
                    skipped.append((i, f'Duplicate code "{code}"'))
                    continue

                seen_codes.add(code)
                countries.append(Country(
                    country_code=code,
                    country_name=name,         # 🔁 updated here
                    currency_code=currency
                ))

        # 💾 Step 3: Save valid records
        db.session.bulk_save_objects(countries)
        db.session.commit()
        print(f"✅ Inserted {len(countries)} countries into the database.")

        # 📋 Step 4: Report skipped rows
        if skipped:
            print(f"⚠️ Skipped {len(skipped)} invalid rows:")
            for line, reason in skipped:
                print(f"  - Line {line}: {reason}")

if __name__ == '__main__':
    seed_countries_from_csv()