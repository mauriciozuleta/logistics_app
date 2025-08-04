

import json
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
@operations.route('/add-route/<int:route_id>', methods=['GET', 'POST'])
def add_route(route_id=None):
    # Check if we're editing an existing route
    route_to_edit = None
    if route_id:
        route_to_edit = Route.query.get_or_404(route_id)
    
    if request.method == 'POST':
        try:
            print("=== DEBUG: POST request received ===")  # Debug log
            print(f"Request headers: {dict(request.headers)}")  # Debug log
            print(f"Request form keys: {list(request.form.keys())}")  # Debug log
            print(f"Request form values: {dict(request.form)}")  # Debug log
            
            # Extract form data
            aircraft_id = request.form.get('aircraft_type')
            route_type = request.form.get('route_type')
            from_airport_id = request.form.get('from_airport')
            to_airport_id = request.form.get('to_airport')
            finish_airport_id = request.form.get('finish_airport') if route_type == 'multiple' else None
            
            print(f"Form data: aircraft_id={aircraft_id}, route_type={route_type}, from={from_airport_id}, to={to_airport_id}")  # Debug log
            
            # Extract calculated route data from JavaScript
            route_data_json = request.form.get('route_data')
            route_data = {}
            if route_data_json:
                route_data = json.loads(route_data_json)
                print(f"Route data received: {len(route_data)} items")  # Debug log
            else:
                print("No route data received!")  # Debug log
            
            # Get aircraft and airport objects
            print(f"Looking up aircraft with ID: {aircraft_id}")  # Debug log
            aircraft = Aircraft.query.get(aircraft_id)
            print(f"Aircraft found: {aircraft.short_name if aircraft else 'None'}")  # Debug log
            
            print(f"Looking up airports: from={from_airport_id}, to={to_airport_id}, finish={finish_airport_id}")  # Debug log
            from_airport = Airport.query.get(from_airport_id)
            to_airport = Airport.query.get(to_airport_id)
            finish_airport = Airport.query.get(finish_airport_id) if finish_airport_id else None
            
            print(f"Airports found: from={from_airport.iata_code if from_airport else 'None'}, to={to_airport.iata_code if to_airport else 'None'}")  # Debug log
            
            if not aircraft or not from_airport or not to_airport:
                print(f"ERROR: Missing required data - aircraft: {aircraft is not None}, from_airport: {from_airport is not None}, to_airport: {to_airport is not None}")  # Debug log
                flash('Required aircraft or airport data missing', 'error')
                return redirect(url_for('operations.add_route'))
            
            # Create route summary data
            route_summary = f"{from_airport.iata_code} to {to_airport.iata_code}"
            if route_type == 'multiple' and finish_airport:
                route_summary += f" to {finish_airport.iata_code}"
            
            # Extract totals from route data
            totals = route_data.get('totals', {})
            legs = route_data.get('legs', [])
            payload_data = route_data.get('payloadData', [])
            print(f"Totals extracted: {totals}")  # Debug log
            print(f"Legs extracted: {len(legs)} legs")  # Debug log
            print(f"Payload data extracted: {len(payload_data)} payload entries")  # Debug log
            
            # Extract leg 1 data
            leg1_data = legs[0] if len(legs) > 0 else {}
            leg1_payload = payload_data[0] if len(payload_data) > 0 else {}
            
            # Extract leg 2 data (for round-trip and multiple routes)
            leg2_data = legs[1] if len(legs) > 1 else {}
            leg2_payload = payload_data[1] if len(payload_data) > 1 else {}
            
            print(f"Leg 1 data: {list(leg1_data.keys()) if leg1_data else 'None'}")  # Debug log
            print(f"Leg 1 payload: {list(leg1_payload.keys()) if leg1_payload else 'None'}")  # Debug log
            print(f"Leg 2 data: {list(leg2_data.keys()) if leg2_data else 'None'}")  # Debug log
            
            # Debug: Print actual values to see what's being sent
            if leg1_data:
                print(f"Leg 1 data values: {leg1_data}")  # Debug log
            if leg1_payload:
                print(f"Leg 1 payload values: {leg1_payload}")  # Debug log
            if leg2_data:
                print(f"Leg 2 data values: {leg2_data}")  # Debug log
            
            # Create separate route records based on route type
            print("Creating route records...")  # Debug log
            created_routes = []
            
            try:
                if route_to_edit:
                    # For editing, we'll handle this differently - for now, let's focus on new routes
                    flash('Route editing is not supported with the new multi-record system yet', 'warning')
                    return redirect(url_for('operations.add_route'))
                else:
                    # Create separate records for each leg
                    if route_type == 'one-way':
                        # One record: from → to
                        print("Creating one-way route record")
                        route_record = Route(
                            aircraft_id=aircraft_id,
                            route_type=route_type,
                            from_airport_id=from_airport_id,
                            to_airport_id=to_airport_id,
                            finish_airport_id=None,
                            route_summary=f"{from_airport.iata_code} → {to_airport.iata_code}",
                            aircraft_name=aircraft.short_name,
                            from_airport_name=f"{from_airport.iata_code} - {from_airport.name}",
                            to_airport_name=f"{to_airport.iata_code} - {to_airport.name}",
                            finish_airport_name=None,
                            
                            # Individual leg data (using leg1 data)
                            total_distance_nm=leg1_data.get('distance_nm', 0),
                            total_flight_time_hours=leg1_data.get('flight_time_hours', 0),
                            total_fuel_gallons=leg1_data.get('fuel_gallons', 0),
                            total_fuel_cost=leg1_data.get('fuel_cost', 0),
                            total_block_hours_cost=leg1_data.get('block_hours_cost', 0),
                            total_cost=leg1_data.get('total_leg_cost', 0),
                            
                            # Leg 1 route data
                            leg1_route=leg1_data.get('route', ''),
                            leg1_distance=leg1_data.get('distance_nm', 0),
                            leg1_flight_time=leg1_data.get('flight_time_hours', 0),
                            leg1_route_fuel_gls=leg1_data.get('fuel_gallons', 0),
                            leg1_bh_cost_usd=leg1_data.get('block_hours_cost', 0),
                            leg1_fuel_cost_usd=leg1_data.get('fuel_cost', 0),
                            leg1_total_cost_usd=leg1_data.get('total_leg_cost', 0),
                            
                            # Leg 1 payload data
                            leg1_oew_lbs=leg1_payload.get('empty_weight_lbs', 0),
                            leg1_fuel_weight_lbs=leg1_payload.get('fuel_weight_lbs', 0),
                            leg1_max_payload_lbs=leg1_payload.get('max_payload_lbs', 0),
                            leg1_no_tank_tow_lbs=leg1_payload.get('no_tank_tow_lbs', 0),
                            leg1_avail_extra_fuel_lbs=leg1_payload.get('avail_extra_fuel_lbs', 0),
                            leg1_tank_tow_lbs=leg1_payload.get('tank_tow_lbs', 0),
                            
                            # Store JSON for reference
                            leg_details=json.dumps([leg1_data]),
                            payload_details=json.dumps([leg1_payload])
                        )
                        created_routes.append(route_record)
                        
                    elif route_type == 'round-trip':
                        # Two records: from → to, to → from
                        print("Creating round-trip route records")
                        
                        # First leg: from → to
                        route_record_1 = Route(
                            aircraft_id=aircraft_id,
                            route_type='one-way',  # Each record is stored as one-way
                            from_airport_id=from_airport_id,
                            to_airport_id=to_airport_id,
                            finish_airport_id=None,
                            route_summary=f"{from_airport.iata_code} → {to_airport.iata_code} (Leg 1 of Round-trip)",
                            aircraft_name=aircraft.short_name,
                            from_airport_name=f"{from_airport.iata_code} - {from_airport.name}",
                            to_airport_name=f"{to_airport.iata_code} - {to_airport.name}",
                            finish_airport_name=None,
                            
                            # Individual leg data (using leg1 data)
                            total_distance_nm=leg1_data.get('distance_nm', 0),
                            total_flight_time_hours=leg1_data.get('flight_time_hours', 0),
                            total_fuel_gallons=leg1_data.get('fuel_gallons', 0),
                            total_fuel_cost=leg1_data.get('fuel_cost', 0),
                            total_block_hours_cost=leg1_data.get('block_hours_cost', 0),
                            total_cost=leg1_data.get('total_leg_cost', 0),
                            
                            # Leg 1 route data
                            leg1_route=leg1_data.get('route', ''),
                            leg1_distance=leg1_data.get('distance_nm', 0),
                            leg1_flight_time=leg1_data.get('flight_time_hours', 0),
                            leg1_route_fuel_gls=leg1_data.get('fuel_gallons', 0),
                            leg1_bh_cost_usd=leg1_data.get('block_hours_cost', 0),
                            leg1_fuel_cost_usd=leg1_data.get('fuel_cost', 0),
                            leg1_total_cost_usd=leg1_data.get('total_leg_cost', 0),
                            
                            # Leg 1 payload data
                            leg1_oew_lbs=leg1_payload.get('empty_weight_lbs', 0),
                            leg1_fuel_weight_lbs=leg1_payload.get('fuel_weight_lbs', 0),
                            leg1_max_payload_lbs=leg1_payload.get('max_payload_lbs', 0),
                            leg1_no_tank_tow_lbs=leg1_payload.get('no_tank_tow_lbs', 0),
                            leg1_avail_extra_fuel_lbs=leg1_payload.get('avail_extra_fuel_lbs', 0),
                            leg1_tank_tow_lbs=leg1_payload.get('tank_tow_lbs', 0),
                            
                            # Store JSON for reference
                            leg_details=json.dumps([leg1_data]),
                            payload_details=json.dumps([leg1_payload])
                        )
                        created_routes.append(route_record_1)
                        
                        # Second leg: to → from (using leg2 data)
                        route_record_2 = Route(
                            aircraft_id=aircraft_id,
                            route_type='one-way',  # Each record is stored as one-way
                            from_airport_id=to_airport_id,  # Reversed
                            to_airport_id=from_airport_id,  # Reversed
                            finish_airport_id=None,
                            route_summary=f"{to_airport.iata_code} → {from_airport.iata_code} (Leg 2 of Round-trip)",
                            aircraft_name=aircraft.short_name,
                            from_airport_name=f"{to_airport.iata_code} - {to_airport.name}",
                            to_airport_name=f"{from_airport.iata_code} - {from_airport.name}",
                            finish_airport_name=None,
                            
                            # Individual leg data (using leg2 data)
                            total_distance_nm=leg2_data.get('distance_nm', 0),
                            total_flight_time_hours=leg2_data.get('flight_time_hours', 0),
                            total_fuel_gallons=leg2_data.get('fuel_gallons', 0),
                            total_fuel_cost=leg2_data.get('fuel_cost', 0),
                            total_block_hours_cost=leg2_data.get('block_hours_cost', 0),
                            total_cost=leg2_data.get('total_leg_cost', 0),
                            
                            # Leg 1 route data (storing leg2 data in leg1 fields for this record)
                            leg1_route=leg2_data.get('route', ''),
                            leg1_distance=leg2_data.get('distance_nm', 0),
                            leg1_flight_time=leg2_data.get('flight_time_hours', 0),
                            leg1_route_fuel_gls=leg2_data.get('fuel_gallons', 0),
                            leg1_bh_cost_usd=leg2_data.get('block_hours_cost', 0),
                            leg1_fuel_cost_usd=leg2_data.get('fuel_cost', 0),
                            leg1_total_cost_usd=leg2_data.get('total_leg_cost', 0),
                            
                            # Leg 1 payload data (storing leg2 payload in leg1 fields for this record)
                            leg1_oew_lbs=leg2_payload.get('empty_weight_lbs', 0),
                            leg1_fuel_weight_lbs=leg2_payload.get('fuel_weight_lbs', 0),
                            leg1_max_payload_lbs=leg2_payload.get('max_payload_lbs', 0),
                            leg1_no_tank_tow_lbs=leg2_payload.get('no_tank_tow_lbs', 0),
                            leg1_avail_extra_fuel_lbs=leg2_payload.get('avail_extra_fuel_lbs', 0),
                            leg1_tank_tow_lbs=leg2_payload.get('tank_tow_lbs', 0),
                            
                            # Store JSON for reference
                            leg_details=json.dumps([leg2_data]),
                            payload_details=json.dumps([leg2_payload])
                        )
                        created_routes.append(route_record_2)
                        
                    elif route_type == 'multiple':
                        # Two records: from → to, to → finish
                        print("Creating multiple route records")
                        
                        # First leg: from → to
                        route_record_1 = Route(
                            aircraft_id=aircraft_id,
                            route_type='one-way',  # Each record is stored as one-way
                            from_airport_id=from_airport_id,
                            to_airport_id=to_airport_id,
                            finish_airport_id=None,
                            route_summary=f"{from_airport.iata_code} → {to_airport.iata_code} (Leg 1 of Multiple)",
                            aircraft_name=aircraft.short_name,
                            from_airport_name=f"{from_airport.iata_code} - {from_airport.name}",
                            to_airport_name=f"{to_airport.iata_code} - {to_airport.name}",
                            finish_airport_name=None,
                            
                            # Individual leg data (using leg1 data)
                            total_distance_nm=leg1_data.get('distance_nm', 0),
                            total_flight_time_hours=leg1_data.get('flight_time_hours', 0),
                            total_fuel_gallons=leg1_data.get('fuel_gallons', 0),
                            total_fuel_cost=leg1_data.get('fuel_cost', 0),
                            total_block_hours_cost=leg1_data.get('block_hours_cost', 0),
                            total_cost=leg1_data.get('total_leg_cost', 0),
                            
                            # Leg 1 route data
                            leg1_route=leg1_data.get('route', ''),
                            leg1_distance=leg1_data.get('distance_nm', 0),
                            leg1_flight_time=leg1_data.get('flight_time_hours', 0),
                            leg1_route_fuel_gls=leg1_data.get('fuel_gallons', 0),
                            leg1_bh_cost_usd=leg1_data.get('block_hours_cost', 0),
                            leg1_fuel_cost_usd=leg1_data.get('fuel_cost', 0),
                            leg1_total_cost_usd=leg1_data.get('total_leg_cost', 0),
                            
                            # Leg 1 payload data
                            leg1_oew_lbs=leg1_payload.get('empty_weight_lbs', 0),
                            leg1_fuel_weight_lbs=leg1_payload.get('fuel_weight_lbs', 0),
                            leg1_max_payload_lbs=leg1_payload.get('max_payload_lbs', 0),
                            leg1_no_tank_tow_lbs=leg1_payload.get('no_tank_tow_lbs', 0),
                            leg1_avail_extra_fuel_lbs=leg1_payload.get('avail_extra_fuel_lbs', 0),
                            leg1_tank_tow_lbs=leg1_payload.get('tank_tow_lbs', 0),
                            
                            # Store JSON for reference
                            leg_details=json.dumps([leg1_data]),
                            payload_details=json.dumps([leg1_payload])
                        )
                        created_routes.append(route_record_1)
                        
                        # Second leg: to → finish (using leg2 data)
                        route_record_2 = Route(
                            aircraft_id=aircraft_id,
                            route_type='one-way',  # Each record is stored as one-way
                            from_airport_id=to_airport_id,
                            to_airport_id=finish_airport_id,
                            finish_airport_id=None,
                            route_summary=f"{to_airport.iata_code} → {finish_airport.iata_code} (Leg 2 of Multiple)",
                            aircraft_name=aircraft.short_name,
                            from_airport_name=f"{to_airport.iata_code} - {to_airport.name}",
                            to_airport_name=f"{finish_airport.iata_code} - {finish_airport.name}",
                            finish_airport_name=None,
                            
                            # Individual leg data (using leg2 data)
                            total_distance_nm=leg2_data.get('distance_nm', 0),
                            total_flight_time_hours=leg2_data.get('flight_time_hours', 0),
                            total_fuel_gallons=leg2_data.get('fuel_gallons', 0),
                            total_fuel_cost=leg2_data.get('fuel_cost', 0),
                            total_block_hours_cost=leg2_data.get('block_hours_cost', 0),
                            total_cost=leg2_data.get('total_leg_cost', 0),
                            
                            # Leg 1 route data (storing leg2 data in leg1 fields for this record)
                            leg1_route=leg2_data.get('route', ''),
                            leg1_distance=leg2_data.get('distance_nm', 0),
                            leg1_flight_time=leg2_data.get('flight_time_hours', 0),
                            leg1_route_fuel_gls=leg2_data.get('fuel_gallons', 0),
                            leg1_bh_cost_usd=leg2_data.get('block_hours_cost', 0),
                            leg1_fuel_cost_usd=leg2_data.get('fuel_cost', 0),
                            leg1_total_cost_usd=leg2_data.get('total_leg_cost', 0),
                            
                            # Leg 1 payload data (storing leg2 payload in leg1 fields for this record)
                            leg1_oew_lbs=leg2_payload.get('empty_weight_lbs', 0),
                            leg1_fuel_weight_lbs=leg2_payload.get('fuel_weight_lbs', 0),
                            leg1_max_payload_lbs=leg2_payload.get('max_payload_lbs', 0),
                            leg1_no_tank_tow_lbs=leg2_payload.get('no_tank_tow_lbs', 0),
                            leg1_avail_extra_fuel_lbs=leg2_payload.get('avail_extra_fuel_lbs', 0),
                            leg1_tank_tow_lbs=leg2_payload.get('tank_tow_lbs', 0),
                            
                            # Store JSON for reference
                            leg_details=json.dumps([leg2_data]),
                            payload_details=json.dumps([leg2_payload])
                        )
                        created_routes.append(route_record_2)
                    
                    print(f"Created {len(created_routes)} route records")  # Debug log
                    
            except Exception as route_create_error:
                print(f"ERROR creating Route objects: {route_create_error}")  # Debug log
                raise route_create_error
            
            print(f"=== DEBUG: Route records created ===")  # Debug log
            for i, route in enumerate(created_routes):
                print(f"Route {i+1} summary: {route.route_summary}")  # Debug log
                print(f"Route {i+1} cost: {route.total_cost}")  # Debug log
            
            # Add all route records to database
            for route in created_routes:
                db.session.add(route)
            print("Committing to database...")  # Debug log
            db.session.commit()
            
            print(f"=== DEBUG: {len(created_routes)} route records saved to database ===")  # Debug log
            for route in created_routes:
                print(f"Saved route ID={route.id}, Summary={route.route_summary}")  # Debug log
            
            # Handle AJAX requests
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return jsonify({'success': True, 'message': f'{len(created_routes)} route records saved successfully!'})
            
            flash(f'{len(created_routes)} route records saved successfully!', 'success')
            return redirect(url_for('operations.view_routes'))
            
        except Exception as e:
            print(f"=== ERROR in add_route: {str(e)} ===")  # Debug log
            print(f"Error type: {type(e).__name__}")  # Debug log
            import traceback
            print(f"Traceback: {traceback.format_exc()}")  # Debug log
            db.session.rollback()
            # Handle AJAX requests
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return jsonify({'success': False, 'error': str(e)}), 500
            
            flash(f'Error saving route records: {str(e)}', 'error')
            return redirect(url_for('operations.add_route'))
    
    # GET request - show form
    airports = Airport.query.order_by(Airport.city, Airport.iata_code).all()
    airport_choices = [(a.id, f"{a.city} / {a.iata_code}") for a in airports]
    aircrafts = Aircraft.query.order_by(Aircraft.short_name).all()
    aircraft_choices = [(a.id, a.short_name) for a in aircrafts]
    
    # Pass route data for editing if route_id is provided
    return render_template('operations/add_route.html', 
                         airport_choices=airport_choices, 
                         aircraft_choices=aircraft_choices,
                         route_to_edit=route_to_edit,
                         csrf_token=generate_csrf())

@operations.route('/view-routes')
def view_routes():
    routes = Route.query.order_by(Route.created_at.desc()).all()
    print(f"=== DEBUG: Fetched {len(routes)} routes from database ===")  # Debug log
    for route in routes:
        print(f"Route ID: {route.id}, Summary: {route.route_summary}, Cost: {route.total_cost}")  # Debug log
    return render_template('operations/view_routes.html', 
                         routes=routes,
                         csrf_token=generate_csrf())

@operations.route('/route-details/<int:route_id>')
def route_details(route_id):
    route = Route.query.get_or_404(route_id)
    
    # Parse JSON details if available
    leg_details = []
    payload_details = []
    
    if route.leg_details:
        try:
            leg_details = json.loads(route.leg_details)
        except:
            leg_details = []
    
    if route.payload_details:
        try:
            payload_details = json.loads(route.payload_details)
        except:
            payload_details = []
    
    return jsonify({
        'route_summary': route.route_summary,
        'aircraft_name': route.aircraft_name,
        'route_type': route.route_type,
        'from_airport_name': route.from_airport_name,
        'to_airport_name': route.to_airport_name,
        'finish_airport_name': route.finish_airport_name,
        'created_at': route.created_at.strftime('%Y-%m-%d %H:%M') if route.created_at else None,
        
        # Add totals
        'total_distance_nm': route.total_distance_nm,
        'total_flight_time_hours': route.total_flight_time_hours,
        'total_fuel_gallons': route.total_fuel_gallons,
        'total_fuel_cost': route.total_fuel_cost,
        'total_block_hours_cost': route.total_block_hours_cost,
        'total_cost': route.total_cost,
        
        # Add detailed data
        'leg_details': leg_details,
        'payload_details': payload_details
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

# API endpoint to check if route already exists
@operations_api.route('/check-route-exists', methods=['POST'])
def check_route_exists():
    data = request.get_json()
    aircraft_id = data.get('aircraft_id')
    route_type = data.get('route_type')
    from_airport_id = data.get('from_airport_id')
    to_airport_id = data.get('to_airport_id')
    finish_airport_id = data.get('finish_airport_id')
    
    try:
        # Get airport objects for IATA codes
        from_airport = Airport.query.get(from_airport_id)
        to_airport = Airport.query.get(to_airport_id)
        finish_airport = Airport.query.get(finish_airport_id) if finish_airport_id else None
        
        if not from_airport or not to_airport:
            return jsonify({'exists': False, 'routes': []})
        
        existing_routes = []
        
        if route_type == 'one-way':
            # Check for one-way route: from → to
            routes = Route.query.filter_by(
                aircraft_id=aircraft_id,
                from_airport_id=from_airport_id,
                to_airport_id=to_airport_id
            ).all()
            existing_routes.extend(routes)
            
        elif route_type == 'round-trip':
            # Check for both legs of round-trip: from → to and to → from
            leg1_routes = Route.query.filter_by(
                aircraft_id=aircraft_id,
                from_airport_id=from_airport_id,
                to_airport_id=to_airport_id
            ).all()
            
            leg2_routes = Route.query.filter_by(
                aircraft_id=aircraft_id,
                from_airport_id=to_airport_id,
                to_airport_id=from_airport_id
            ).all()
            
            existing_routes.extend(leg1_routes)
            existing_routes.extend(leg2_routes)
            
        elif route_type == 'multiple' and finish_airport:
            # Check for both legs of multiple route: from → to and to → finish
            leg1_routes = Route.query.filter_by(
                aircraft_id=aircraft_id,
                from_airport_id=from_airport_id,
                to_airport_id=to_airport_id
            ).all()
            
            leg2_routes = Route.query.filter_by(
                aircraft_id=aircraft_id,
                from_airport_id=to_airport_id,
                to_airport_id=finish_airport_id
            ).all()
            
            existing_routes.extend(leg1_routes)
            existing_routes.extend(leg2_routes)
        
        if existing_routes:
            # Format route information for display
            route_info = []
            for route in existing_routes:
                route_info.append({
                    'id': route.id,
                    'summary': route.route_summary,
                    'total_cost': route.total_cost,
                    'created_at': route.created_at.strftime('%Y-%m-%d %H:%M') if route.created_at else None
                })
            
            return jsonify({
                'exists': True,
                'routes': route_info,
                'message': f'Found {len(existing_routes)} existing route(s) with similar configuration'
            })
        else:
            return jsonify({'exists': False, 'routes': []})
            
    except Exception as e:
        print(f"Error checking route existence: {str(e)}")
        return jsonify({'exists': False, 'routes': [], 'error': str(e)}), 500

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