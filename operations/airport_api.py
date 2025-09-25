from flask import Blueprint, request, jsonify
from models import Airport
from extensions import db

# Create blueprint for airport API
airport_api = Blueprint('airport_api', __name__)

@airport_api.route('/airport-cargo-handling-cost', methods=['GET'])
def get_airport_cargo_handling_cost():
    """Get the cargo handling cost per kg for an airport by IATA code"""
    iata_code = request.args.get('iata_code', '').strip().upper()
    if not iata_code:
        return jsonify({'error': 'IATA code is required'}), 400
    
    # Find the airport by IATA code
    airport = Airport.query.filter_by(iata_code=iata_code).first()
    if not airport:
        return jsonify({'error': f'No airport found with IATA code {iata_code}'}), 404
    
    return jsonify({
        'iata_code': iata_code,
        'name': airport.name,
        'city': airport.city,
        'country_id': airport.country_id,
        'cargo_handling_cost_kg': airport.cargo_handling_cost_kg
    })