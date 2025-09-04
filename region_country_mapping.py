from app import app, db
from models import Region, Country, CountryTradeInfo

def generate_region_country_mapping():
    """
    Generate a mapping of countries to regions that works with the dropdowns.
    This is a temporary solution to fix the dropdown filtering issue.
    """
    with app.app_context():
        # Get all regions
        regions = Region.query.all()
        region_map = {region.id: region.name for region in regions}
        
        # Get all countries with their regions
        countries = Country.query.all()
        country_trade_infos = CountryTradeInfo.query.all()
        
        # For each country, store both region ID and name for easier filtering
        country_list = []
        for country in countries:
            # Get the trade info for this country
            trade_info = next((cti for cti in country_trade_infos 
                               if cti.country_id == country.country_code), None)
            
            country_dict = {
                "code": country.country_code,
                "name": country.country_name,
                "region": country.region,  # Keep the original geographic region for compatibility
                "region_id": trade_info.region_id if trade_info else None,
                "region_name": region_map.get(trade_info.region_id, "Unknown") if trade_info else None,
                "currency_code": getattr(country, "currency_code", None)
            }
            
            country_list.append(country_dict)
        
        return country_list, region_map

if __name__ == "__main__":
    # For testing
    countries, regions = generate_region_country_mapping()
    print(f"Generated mapping for {len(countries)} countries")
    print(f"Region map: {regions}")
    print(f"Sample countries: {countries[:5]}")
