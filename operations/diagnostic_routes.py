from flask import render_template, Blueprint
from models import Region, Country, CountryTradeInfo

operations_diagnostic = Blueprint('operations_diagnostic', __name__, template_folder='templates')

@operations_diagnostic.route('/dropdown_diagnostic')
def dropdown_diagnostic():
    """Diagnostic page to debug the dropdown functionality"""
    # Get all regions
    regions = Region.query.order_by(Region.name).all()
    
    # Get all country trade infos
    country_trade_infos = CountryTradeInfo.query.all()
    
    # Get all countries
    countries = Country.query.all()
    
    # Create a mapping of country codes to names for easy lookup
    countries_by_code = {c.country_code: c.country_name for c in countries}
    
    # Create a mapping of region IDs to names for easy lookup
    regions_by_id = {r.id: r.name for r in regions}
    
    # Create region manager map for JavaScript
    region_manager_map = {r.id: r.manager_name for r in regions}
    
    # Format country list for JavaScript
    country_list = []
    for c in countries:
        trade_info = next((cti for cti in country_trade_infos if cti.country_id == c.country_code), None)
        country_dict = {
            "code": c.country_code,
            "name": c.country_name,
            "region": trade_info.region_id if trade_info else None,
            "geographic_region": c.region
        }
        country_list.append(country_dict)
    
    return render_template(
        'operations/dropdown_diagnostic.html',
        regions=regions,
        country_trade_infos=country_trade_infos,
        countries_by_code=countries_by_code,
        regions_by_id=regions_by_id,
        region_manager_map=region_manager_map,
        country_list=country_list
    )
