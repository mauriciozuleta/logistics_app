"""
Database verification and setup script to ensure Country, Region and CountryTradeInfo relationships
are correctly established
"""
import os
import sys
from flask import Flask
from extensions import db
from models import Country, Region, CountryTradeInfo

def setup_app():
    """Create a Flask app context for database operations"""
    app = Flask(__name__)
    db_path = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'instance', 'your_database.db')
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)
    return app

def verify_countries_regions():
    """Verify countries have region assignments and fix if needed"""
    countries = Country.query.all()
    regions = Region.query.all()
    country_trade_infos = CountryTradeInfo.query.all()
    
    print(f"Found {len(countries)} countries, {len(regions)} regions, and {len(country_trade_infos)} country trade info records")
    
    # Mapping of geographic regions to business regions
    region_mapping = {
        "Asia-Pacific": "Asia Pacific",
        "Europe": "Europe", 
        "North America": "North America",
        "South America": "Latin America",
        "Central America": "Latin America",
        "Africa": "Africa",
        "Middle East": "Middle East",
        "Caribbean": "Latin America",
        "Oceania": "Asia Pacific",
    }
    
    # Create regions if they don't exist
    region_name_to_id = {}
    for region_name in set(region_mapping.values()):
        region = Region.query.filter_by(name=region_name).first()
        if not region:
            print(f"Creating missing region: {region_name}")
            region = Region(name=region_name, manager_name=f"{region_name} Manager")
            db.session.add(region)
            db.session.commit()
        
        region_name_to_id[region_name] = region.id
    
    # Check which countries are missing trade info
    countries_without_trade_info = []
    for country in countries:
        trade_info = CountryTradeInfo.query.filter_by(country_id=country.country_code).first()
        if not trade_info:
            countries_without_trade_info.append(country)
    
    if countries_without_trade_info:
        print(f"Found {len(countries_without_trade_info)} countries without trade info")
        for country in countries_without_trade_info:
            # Map geographic region to business region
            business_region = region_mapping.get(country.region, "Unassigned")
            region_id = region_name_to_id.get(business_region)
            
            if not region_id:
                print(f"Error: Could not find region ID for {business_region}")
                continue
                
            print(f"Creating trade info for {country.country_name} (geographic region: {country.region}) -> business region: {business_region} (ID: {region_id})")
            
            # Create trade info
            trade_info = CountryTradeInfo(
                country_id=country.country_code,
                region_id=region_id,
                operational_cost_year=1000.0,  # Default values
                revenue_taxes=0.1,
                export_profit_pct=0.15,
                export_sales_tax=0.05,
                import_profit_pct=0.15,
                import_taxes=0.07
            )
            db.session.add(trade_info)
    
    # Commit all changes
    db.session.commit()
    print("Database verification and setup completed successfully")

if __name__ == "__main__":
    app = setup_app()
    with app.app_context():
        verify_countries_regions()
