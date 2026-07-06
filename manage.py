import os
import csv
import click
from flask.cli import with_appcontext

from app import app, create_app
from data.seed_all_from_csv import seed_all
from models import Aircraft, Country, Route, Product, Airport, Shipment, ShipmentProduct


# The app instance from app.py is now exposed for Flask run and CLI

@click.group(name='db-cli')
def db_cli():
    """Custom database commands for seeding, exporting, etc."""
    pass

@db_cli.command('seed')
@with_appcontext
def seed_command():
    """Seeds all database tables from the CSV files in the /data directory."""
    click.echo('🌱 Starting database seed...')
    try:
        seed_all()
        click.echo('✅ Database seeding completed successfully.')
    except Exception as e:
        click.echo(f'❌ An error occurred during seeding: {e}')


def _export_model_to_csv(model, file_path):
    """Generic helper to export a model to a CSV file."""
    records = model.query.all()
    if not records:
        click.echo(f"   -> No records found for {model.__tablename__}. Skipping export.")
        return 0

    columns = [c.name for c in model.__table__.columns]

    with open(file_path, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(columns)
        for record in records:
            writer.writerow([getattr(record, col) for col in columns])
    
    click.echo(f"   -> Exported {len(records)} records from '{model.__tablename__}' to '{os.path.basename(file_path)}'")
    return len(records)


@db_cli.command('export')
@click.option('--table', '-t', default=None, help='Export only a specific table (e.g., Product, Aircraft).')
@with_appcontext
def export_command(table):
    """Exports database tables to CSV files in the /data directory."""
    click.echo('📤 Starting database export...')
    base_dir = os.path.join(os.path.dirname(__file__), 'data')
    os.makedirs(base_dir, exist_ok=True)

    models_to_export = {
        'Aircraft': Aircraft,
        'Route': Route,
        'Product': Product,
        'Airport': Airport,
        'Shipment': Shipment,
        'Country': Country
    }

    total_exported = 0
    if table:
        # Sanitize table name to match the keys in our dictionary
        model_to_export = models_to_export.get(table.capitalize())
        if model_to_export:
            click.echo(f"Exporting single table: {table}...")
            total_exported += _export_model_to_csv(model_to_export, os.path.join(base_dir, f'{model_to_export.__tablename__}_export.csv'))
        else:
            click.echo(f"❌ Error: Table '{table}' not found. Available tables: {', '.join(models_to_export.keys())}")
            return
    else:
        click.echo("Exporting all tables...")
        for name, model in models_to_export.items():
            total_exported += _export_model_to_csv(model, os.path.join(base_dir, f'{model.__tablename__}_export.csv'))

    click.echo(f'✅ Database export completed successfully. Exported {total_exported} records in total.')

app.cli.add_command(db_cli)