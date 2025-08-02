

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

# API endpoint for distance calculation

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