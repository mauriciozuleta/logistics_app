from app import app
from extensions import db
from sqlalchemy import inspect

def verify_route_table_schema():
    """
    Connects to the database and prints the schema for the 'routes' table.
    """
    with app.app_context():
        try:
            inspector = inspect(db.engine)
            columns = inspector.get_columns('routes')
            
            print("=" * 60)
            print("Verifying schema for 'routes' table from application's perspective...")
            print("=" * 60)
            
            if not columns:
                print("❌ Could not find the 'routes' table in the database.")
                return

            print(f"{'Column Name':<40} {'Type'}")
            print("-" * 60)
            
            found_adjusted_time = False
            for column in columns:
                col_name = column['name']
                col_type = column['type']
                print(f"{col_name:<40} {col_type}")
                if 'adjusted_flight_time' in col_name:
                    found_adjusted_time = True

            print("-" * 60)
            if found_adjusted_time:
                print("✅ Success: The 'adjusted_flight_time' columns were found.")
            else:
                print("❌ CRITICAL FAILURE: The 'adjusted_flight_time' columns are MISSING.")
                print("   This confirms the 'flask db upgrade' command did not alter the database.")

        except Exception as e:
            print(f"An error occurred while inspecting the database: {e}")

if __name__ == "__main__":
    verify_route_table_schema()