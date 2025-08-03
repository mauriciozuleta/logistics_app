

from flask import Blueprint, render_template, request, jsonify
from models import Airport, Aircraft
from operations.flight_distances_db import calculate_distance_db

operations = Blueprint("operations", __name__, template_folder="templates")
operations_api = Blueprint("operations_api", __name__)


@operations.route('/dashboard')
def dashboard():
    return render_template('operations/operations_dashboard.html')

@operations.route('/add-route', methods=['GET', 'POST'])
def add_route():
    airports = Airport.query.order_by(Airport.city, Airport.iata_code).all()
    airport_choices = [(a.id, f"{a.city} / {a.iata_code}") for a in airports]
    aircrafts = Aircraft.query.order_by(Aircraft.short_name).all()
    aircraft_choices = [(a.id, a.short_name) for a in aircrafts]
    return render_template('operations/add_route.html', airport_choices=airport_choices, aircraft_choices=aircraft_choices)

# API endpoint for aircraft cruise speed
@operations_api.route('/aircraft-cruise-speed', methods=['POST'])
def aircraft_cruise_speed():
    data = request.get_json()
    aircraft_id = data.get('aircraft_id')
    aircraft = Aircraft.query.filter_by(id=aircraft_id).first()
    if aircraft:
        return jsonify({
            'cruise_speed': aircraft.cruise_speed,
            'fuel_burn_lbs': aircraft.fuel_burn_lbs,
            'min_fuel_landed_lbs': aircraft.min_fuel_landed_lbs,
            'min_fuel_alternate_lbs': aircraft.min_fuel_alternate_lbs,
            'acmi_cost': aircraft.acmi_cost,
            'empty_weight_lbs': aircraft.empty_weight_lbs,
            'mtow_lbs': aircraft.mtow_lbs,
            'mldgw_lbs': aircraft.mldgw_lbs,
            'max_payload_lbs': aircraft.max_payload_lbs
        })
    return jsonify({
        'cruise_speed': None, 
        'fuel_burn_lbs': None, 
        'min_fuel_landed_lbs': None, 
        'min_fuel_alternate_lbs': None, 
        'acmi_cost': None,
        'empty_weight_lbs': None,
        'mtow_lbs': None,
        'mldgw_lbs': None,
        'max_payload_lbs': None
    }), 404

# API endpoint to get airport fuel cost
@operations_api.route('/airport-fuel-cost', methods=['POST'])
def airport_fuel_cost():
    data = request.get_json()
    airport_id = data.get('airport_id')
    airport = Airport.query.filter_by(id=airport_id).first()
    if airport:
        return jsonify({'fuel_cost_gl': airport.fuel_cost_gl})
    return jsonify({'fuel_cost_gl': None}), 404

# API endpoint to get airport altitude
@operations_api.route('/airport-altitude', methods=['POST'])
def airport_altitude():
    data = request.get_json()
    iata_code = data.get('iata_code')
    airport = Airport.query.filter_by(iata_code=iata_code).first()
    if airport:
        return jsonify({'altitude_ft': airport.altitude_ft})
    return jsonify({'altitude_ft': None}), 404

# API endpoint for distance calculation
@operations_api.route('/leg-distances', methods=['POST'])
def leg_distances():
    data = request.get_json()
    legs = data.get('legs', [])
    results = []
    for leg in legs:
        from_iata = leg.get('from')
        to_iata = leg.get('to')
        dist = calculate_distance_db(from_iata, to_iata)
        results.append({'from': from_iata, 'to': to_iata, 'distance': dist})
    return jsonify({'distances': results})