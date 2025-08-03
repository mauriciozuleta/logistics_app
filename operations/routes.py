

from flask import Blueprint, render_template, request, jsonify, flash, redirect, url_for
from flask_wtf.csrf import generate_csrf
from models import Airport, Aircraft, Route
from operations.flight_distances_db import calculate_distance_db
from extensions import db

operations = Blueprint("operations", __name__, template_folder="templates")
operations_api = Blueprint("operations_api", __name__)


@operations.route('/dashboard')
def dashboard():
    return render_template('operations/operations_dashboard.html')

@operations.route('/add-route', methods=['GET', 'POST'])
def add_route():
    if request.method == 'POST':
        try:
            # Extract form data
            aircraft_id = request.form.get('aircraft_type')
            route_type = request.form.get('route_type')
            from_airport_id = request.form.get('from_airport')
            to_airport_id = request.form.get('to_airport')
            finish_airport_id = request.form.get('finish_airport') if route_type == 'multiple' else None
            
            # Get aircraft and airport objects
            aircraft = Aircraft.query.get(aircraft_id)
            from_airport = Airport.query.get(from_airport_id)
            to_airport = Airport.query.get(to_airport_id)
            finish_airport = Airport.query.get(finish_airport_id) if finish_airport_id else None
            
            if not aircraft or not from_airport or not to_airport:
                flash('Required aircraft or airport data missing', 'error')
                return redirect(url_for('operations.add_route'))
            
            # Create route summary data
            route_summary = f"{from_airport.iata_code} to {to_airport.iata_code}"
            if route_type == 'multiple' and finish_airport:
                route_summary += f" to {finish_airport.iata_code}"
            
            # Create new route record
            new_route = Route(
                aircraft_id=aircraft_id,
                route_type=route_type,
                from_airport_id=from_airport_id,
                to_airport_id=to_airport_id,
                finish_airport_id=finish_airport_id,
                route_summary=route_summary,
                aircraft_name=aircraft.short_name,
                from_airport_name=f"{from_airport.iata_code} - {from_airport.airport_name}",
                to_airport_name=f"{to_airport.iata_code} - {to_airport.airport_name}",
                finish_airport_name=f"{finish_airport.iata_code} - {finish_airport.airport_name}" if finish_airport else None
            )
            
            # Note: Leg-specific data and payload calculations would need to be captured
            # from the frontend JavaScript and sent via AJAX or included in the form
            # For now, we'll save the basic route information
            
            db.session.add(new_route)
            db.session.commit()
            
            flash('Route saved successfully!', 'success')
            return redirect(url_for('operations.view_routes'))
            
        except Exception as e:
            db.session.rollback()
            flash(f'Error saving route: {str(e)}', 'error')
            return redirect(url_for('operations.add_route'))
    
    # GET request - show form
    airports = Airport.query.order_by(Airport.city, Airport.iata_code).all()
    airport_choices = [(a.id, f"{a.city} / {a.iata_code}") for a in airports]
    aircrafts = Aircraft.query.order_by(Aircraft.short_name).all()
    aircraft_choices = [(a.id, a.short_name) for a in aircrafts]
    return render_template('operations/add_route.html', 
                         airport_choices=airport_choices, 
                         aircraft_choices=aircraft_choices,
                         csrf_token=generate_csrf)

@operations.route('/view-routes')
def view_routes():
    routes = Route.query.order_by(Route.created_at.desc()).all()
    return render_template('operations/view_routes.html', 
                         routes=routes,
                         csrf_token=generate_csrf)

@operations.route('/route-details/<int:route_id>')
def route_details(route_id):
    route = Route.query.get_or_404(route_id)
    return jsonify({
        'route_summary': route.route_summary,
        'aircraft_name': route.aircraft_name,
        'route_type': route.route_type,
        'from_airport_name': route.from_airport_name,
        'to_airport_name': route.to_airport_name,
        'finish_airport_name': route.finish_airport_name,
        'created_at': route.created_at.strftime('%Y-%m-%d %H:%M') if route.created_at else None
    })

@operations.route('/delete-route/<int:route_id>', methods=['POST'])
def delete_route(route_id):
    try:
        route = Route.query.get_or_404(route_id)
        db.session.delete(route)
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

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