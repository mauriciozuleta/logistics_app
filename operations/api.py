from flask import Blueprint, request, jsonify
from models import Branch, CountryTradeInfo, Region, Country, Product, Airport
from extensions import db

# Minimal placeholder blueprint for operations API
operations_api_new = Blueprint('operations_api_new', __name__)

@operations_api_new.route('/find-routes')
def find_routes():
    from_airport = request.args.get('from_airport', '').upper()
    to_airport = request.args.get('to_airport', '').upper()
    if not from_airport or not to_airport or len(from_airport) != 3 or len(to_airport) != 3:
        return jsonify({'error': 'Invalid airport codes'}), 400

    # Route name format: MDE-MIA-A321F, MDE-MIA-B737, etc.
    # Find all routes that start with 'MDE-MIA-'
    search_prefix = f"{from_airport}-{to_airport}-"
    from models import Route
    matching_routes = Route.query.filter(Route.route_name.like(f"{search_prefix}%")).all()

    route_options = []
    for route in matching_routes:
        route_options.append({
            'id': route.id,
            'name': route.route_name,
            'aircraft': getattr(route, 'aircraft_type', ''),
            'summary': getattr(route, 'route_summary', ''),
        })

    return jsonify({'routes': route_options})

@operations_api_new.route('/route-details')
def route_details():
    route_id = request.args.get('route_id')
    arrival_iata = request.args.get('arrival_iata', '').upper()
    if not route_id or not arrival_iata:
        return jsonify({'error': 'Missing route_id or arrival_iata'}), 400

    from models import Route, Airport
    route = Route.query.filter_by(id=route_id).first()
    airport = Airport.query.filter_by(iata_code=arrival_iata).first()
    if not route or not airport:
        return jsonify({'error': 'Route or airport not found'}), 404

    # Convert payload to kg
    payload_kg = None
    if route.leg1_max_payload_lbs is not None:
        payload_kg = round(route.leg1_max_payload_lbs / 2.2, 2)

    # Calculate route cost
    route_cost = None
    if route.leg1_total_cost_usd is not None and airport.airport_fee is not None and airport.turnaround_cost is not None:
        route_cost = round(route.leg1_total_cost_usd + airport.airport_fee + airport.turnaround_cost, 2)

    return jsonify({
        'payload_kg': payload_kg,
        'route_cost': route_cost,
        'cargo_handling_cost': airport.cargo_handling_cost_kg,
        'airport_fee': airport.airport_fee,
        'turnaround_cost': airport.turnaround_cost,
        'leg1_total_cost_usd': route.leg1_total_cost_usd
    })

@operations_api_new.route('/return-routes')
def return_routes():
    departure_iata = request.args.get('departure_iata', '').upper()
    aircraft_type = request.args.get('aircraft_type', '')
    print(f"[RETURN ROUTES] Received: departure_iata={departure_iata}, aircraft_type={aircraft_type}")
    
    if not departure_iata or not aircraft_type:
        print("DEBUG: Missing departure_iata or aircraft_type")
        return jsonify({'error': 'Missing departure_iata or aircraft_type'}), 400
    
    from models import Route, Airport
    # Find airport id for the given IATA code (port of arrival)
    airport = Airport.query.filter_by(iata_code=departure_iata).first()
    if not airport:
        print(f"DEBUG: Airport not found for IATA {departure_iata}")
        return jsonify({'error': 'Airport not found'}), 404
    
    print(f"DEBUG: Found airport ID {airport.id} for IATA {departure_iata}")
    
    # Enhanced query for matching routes:
    # 1. Must start from the specified airport (from_airport_id)
    # 2. Must use the same aircraft type (route_name like %AIRCRAFT_TYPE)
    matching_routes = Route.query.filter(
        Route.from_airport_id == airport.id,
        Route.route_name.like(f"%-%-{aircraft_type}")
    ).all()
    
    print(f"DEBUG: Found {len(matching_routes)} matching routes from airport {departure_iata} with aircraft {aircraft_type}")
    
    return_options = []
    for route in matching_routes:
        # Extract destination IATA from to_airport_id
        dest_airport = Airport.query.filter_by(id=route.to_airport_id).first()
        dest_iata = dest_airport.iata_code if dest_airport else ''
        
        print(f"DEBUG: Return route found: {route.route_name}, destination: {dest_iata}")
        
        return_options.append({
            'id': route.id,
            'name': route.route_name,
            'destination': dest_iata,
        })
    
    print(f"[RETURN ROUTES] Returning {len(return_options)} return routes: {return_options}")
    return jsonify({'routes': return_options})

@operations_api_new.route('/ping-test')
def ping():
    return jsonify({'message': 'operations_api_new is alive'})

@operations_api_new.route('/trader-info')
def trader_info():
    port_code = request.args.get('port_code')
    if not port_code:
        return jsonify({'error': 'Missing port_code'}), 400

    branch = Branch.query.filter(
        (Branch.airport_iata == port_code) |
        (Branch.ground_terminal_code == port_code)
    ).first()
    if not branch:
        return jsonify({'error': 'Branch not found'}), 404

    country_trade_info = branch.country_trade_info
    country = country_trade_info.country if country_trade_info else None
    region = country_trade_info.region if country_trade_info else None

    # Build the object with all relevant data
    result = {
        'branch': f"{branch.city or ''} / {branch.name or ''}",
        'country': country.country_name if country else '',
        'region': region.name if region else '',
        'manager': region.manager_name if region else '',
        'branch_id': branch.id,
        'branch_code': branch.branch_code,
        'branch_city': branch.city,
        'branch_name': branch.name,
        'type_of_freight': branch.type_of_freight,
        'airport_iata': branch.airport_iata,
        'ground_terminal_code': branch.ground_terminal_code,
        'country_trade_info_id': branch.country_trade_info_id,
        'country_id': country.country_code if country else '',
        'currency_code': country.currency_code if country else '',
        'region_id': region.id if region else '',
        'region_manager': region.manager_name if region else '',
    }
    # Add all country_trade_info fields
    if country_trade_info:
        for col in CountryTradeInfo.__table__.columns:
            result[col.name] = getattr(country_trade_info, col.name)
    print('DEBUG: Trader Info Object:', result)
    return jsonify(result)

@operations_api_new.route('/airport-country', methods=['GET'])
def get_airport_country():
    """Get the country ID for an IATA airport code"""
    iata_code = request.args.get('iata_code', '').strip().upper()
    if not iata_code:
        return jsonify({'error': 'IATA code is required'}), 400
    
    # Find the airport by IATA code
    airport = Airport.query.filter_by(iata_code=iata_code).first()
    if not airport:
        return jsonify({'error': f'No airport found with IATA code {iata_code}'}), 404
    
    return jsonify({
        'iata_code': iata_code,
        'country_id': airport.country_id,
        'country_name': airport.country.country_name if airport.country else None
    })

@operations_api_new.route('/products-by-country', methods=['GET'])
def get_products_by_country():
    """Get all products for a specific country ID"""
    country_id = request.args.get('country_id', '').strip().upper()
    if not country_id:
        return jsonify({'error': 'Country ID is required'}), 400
    
    # Find products by country ID
    products = Product.query.filter_by(country_id=country_id).all()
    
    # Convert to dictionary for JSON serialization
    products_data = []
    for product in products:
        product_dict = {
            'id': product.id,
            'product_code': product.product_code,
            'name': product.name,
            'product_type': product.product_type,
            'country_id': product.country_id,
            'packaging': product.packaging,
            'packaging_weight': product.packaging_weight,
            'units_per_pack': product.units_per_pack,
            'packaging_cost': product.packaging_cost,
            'currency': product.currency
        }
        products_data.append(product_dict)
    
    return jsonify({
        'country_id': country_id,
        'products': products_data
    })
