import json
from flask import Blueprint, render_template, request, jsonify, flash, redirect, url_for
from flask_wtf.csrf import generate_csrf
from models import Airport, Aircraft, Route, Shipment
from operations.flight_distances_db import calculate_distance_db
from extensions import db

def generate_product_code(product_type):
    prefix = product_type[:2].upper()
    # Count existing products of this type
    from models import Product
    count = Product.query.filter(Product.product_type == product_type).count() + 1
    return f"{prefix}{str(count).zfill(3)}"

operations = Blueprint("operations", __name__, template_folder="templates")
operations_api = Blueprint("operations_api", __name__)


# Add the preview_shipment route after Blueprint definition
@operations.route('/preview_shipment', methods=['GET', 'POST'])
def preview_shipment():
    """Debug page to preview the current shipment draft (localStorage) and DB Shipments, and add new test shipments."""
    if request.method == 'POST':
        # Collect form data and create a new Shipment
        shipment = Shipment(
            shipment_reference=request.form.get('shipment_reference'),
            shipper=request.form.get('shipper'),
            consignee=request.form.get('consignee'),
            first_leg_route=request.form.get('first_leg_route'),
            first_leg_distance=request.form.get('first_leg_distance') or None,
            first_leg_ft=request.form.get('first_leg_ft') or None,
            first_leg_cost=request.form.get('first_leg_cost') or None,
            first_leg_payload=request.form.get('first_leg_payload') or None,
            second_leg_route=request.form.get('second_leg_route'),
            second_leg_distance=request.form.get('second_leg_distance') or None,
            second_leg_ft=request.form.get('second_leg_ft') or None,
            second_leg_cost=request.form.get('second_leg_cost') or None,
            second_leg_payload=request.form.get('second_leg_payload') or None,
            selected_aircraft=request.form.get('selected_aircraft'),
            return_type=request.form.get('return_type'),
            outbound_cost_weight=request.form.get('outbound_cost_weight') or None,
            outbound_tcl=request.form.get('outbound_tcl') or None,
            outbound_kg_cost=request.form.get('outbound_kg_cost') or None,
            return_cost_weight=request.form.get('return_cost_weight') or None,
            return_tcl=request.form.get('return_tcl') or None,
            return_kg_cost=request.form.get('return_kg_cost') or None,
        )
        db.session.add(shipment)
        db.session.commit()
        flash('Test shipment added!', 'success')
        return redirect(url_for('operations.preview_shipment'))
    shipments = Shipment.query.all()
    return render_template('operations/preview_shipment.html', shipments=shipments)


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
                         route_to_edit=route_to_edit)

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

# API endpoint to check if a route already exists
@operations_api.route('/check-route-exists', methods=['POST'])
def check_route_exists():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Missing JSON in request'}), 400

    aircraft_id = data.get('aircraft_id')
    from_airport_id = data.get('from_airport_id')
    to_airport_id = data.get('to_airport_id')

    if not all([aircraft_id, from_airport_id, to_airport_id]):
        return jsonify({'error': 'Missing required route parameters'}), 400

    # Query the database to see if a route with this exact combination exists
    existing_route = Route.query.filter_by(
        aircraft_id=aircraft_id,
        from_airport_id=from_airport_id,
        to_airport_id=to_airport_id
    ).first()

    return jsonify({'exists': bool(existing_route)})


# =====================================
# SHIPMENT MANAGEMENT ROUTES
# =====================================

@operations.route('/add-shipment', methods=['GET', 'POST'])
@operations.route('/add-shipment/<int:shipment_id>', methods=['GET', 'POST'])
def add_shipment(shipment_id=None):
    """Add or edit a shipment"""
    from models import Trader, Product, Route

    # Check if we're editing an existing shipment
    shipment_to_edit = None
    if shipment_id:
        # TODO: Implement shipment model and query
        # shipment_to_edit = Shipment.query.get_or_404(shipment_id)
        pass

    if request.method == 'POST':
        try:
            # --- Collect selected product data ---
            selected_products = request.form.getlist('selected_products')
            products_data = []
            for product_id in selected_products:
                product_data = {
                    'product_id': product_id,
                    'product_name': request.form.get(f'product_name_{product_id}'),
                    'country_id': request.form.get(f'country_id_{product_id}'),
                    'trade_unit': request.form.get(f'trade_unit_{product_id}'),
                    'packaging': request.form.get(f'packaging_{product_id}'),
                    'pack_weight': request.form.get(f'pack_weight_{product_id}'),
                    'pack_cost': request.form.get(f'pack_cost_{product_id}'),
                    'currency': request.form.get(f'currency_{product_id}')
                }
                products_data.append(product_data)
            # --- End product data collection ---

            # TODO: Implement shipment creation/update logic using products_data
            flash(f'Shipment received with {len(products_data)} products.', 'success')
            return redirect(url_for('operations.view_shipments'))
        except Exception as e:
            flash(f'Error processing shipment: {str(e)}', 'error')
            return redirect(url_for('operations.add_shipment'))

    # Get choices for form dropdowns
    from models import Airport
    traders = Trader.query.order_by(Trader.trader_code).all()
    trader_choices = [(t.id, f"{t.trader_code} - {t.name} ({t.city})") for t in traders]

    products = Product.query.order_by(Product.name).all()

# Convert products to a list of dicts for JSON serialization
    products_dicts = [
        {
            'id': p.id,
            'product_code': p.product_code,
            'name': p.name,
            'country_id': p.country_id,
            'trade_unit': p.trade_unit,
            'packaging': p.packaging,
            'packaging_weight': p.packaging_weight,
            'packaging_cost': p.packaging_cost,
            'currency': p.currency,
            'product_type': p.product_type
            # Add any other fields you need in JS
        }
        for p in products
    ]


    product_choices = [(p.id, p.name) for p in products]

    routes = Route.query.order_by(Route.route_name).all()
    route_choices = [(r.id, r.route_summary or r.route_name) for r in routes]

    airports = Airport.query.all()

    airport_data = {str(a.id): {
            'city': a.city,
            'iata_code': a.iata_code,
            'name': a.name,
            'country': a.country_id,
            'fuel_cost_gl': a.fuel_cost_gl,
            'altitude_ft': a.altitude_ft,
            'cargo_handling_cost_kg': a.cargo_handling_cost_kg,
            'airport_fee': a.airport_fee,
            'turnaround_cost': a.turnaround_cost
        } for a in airports}

    trader_data = {str(t.id): {
        'code': t.trader_code,
        'name': t.name,
        'city': t.city,
        'country': t.country_id,
        'export_sales_tax': t.export_sales_tax,
        'export_profit_pct': t.export_profit_pct,
        'export_other_taxes': t.export_other_taxes,
        'import_profit_pct': t.import_profit_pct,
        'import_other_taxes': t.import_other_taxes,
        'import_taxes': t.import_taxes,
        'import_other_cost': t.import_other_cost


    } for t in traders}

    route_data = {}
    for r in routes:
        from_airport = Airport.query.get(r.from_airport_id)
        to_airport = Airport.query.get(r.to_airport_id)

        distance_display = f"{r.total_distance_nm:.1f} NM" if r.total_distance_nm else "N/A"
        flight_time_display = f"{r.total_flight_time_hours:.2f} hrs" if r.total_flight_time_hours else "N/A"

        payload_display = "N/A"
        if r.leg1_max_payload_lbs:
            payload_kg = r.leg1_max_payload_lbs * 0.453592
            payload_display = f"{payload_kg:.0f} kg"
        elif r.aircraft and hasattr(r.aircraft, 'max_payload_kg'):
            payload_display = f"{r.aircraft.max_payload_kg} kg"
        elif r.aircraft and hasattr(r.aircraft, 'payload_capacity'):
            payload_display = f"{r.aircraft.payload_capacity} kg"

        route_data[str(r.id)] = {
            'fromCity': from_airport.city if from_airport else '',
            'toCity': to_airport.city if to_airport else '',
            'fromAirport': from_airport.iata_code if from_airport else '',
            'toAirport': to_airport.iata_code if to_airport else '',
            'summary': r.route_summary or r.route_name,
            'aircraft': [r.aircraft.short_name] if r.aircraft and r.aircraft.short_name else [],
            'distance': distance_display,
            'flight_time': flight_time_display,
            'cost': r.total_cost,
            'payload': payload_display
        }

    return render_template(
        'operations/add_shipment.html',
        shipment_to_edit=shipment_to_edit,
        trader_choices=trader_choices,
        product_choices=product_choices,
        route_choices=route_choices,
        traders=traders,
        routes=routes,
        airports=airports,
        airport_data=airport_data, 
        trader_data=trader_data,
        route_data=route_data,
        products=products_dicts  # <-- NOW PASS THE DICTS
    )

@operations.route('/view-shipments')
def view_shipments():
    """View and manage existing shipments"""
    try:
        # TODO: Implement shipment queries
        # shipments = Shipment.query.all()
        shipments = []  # Placeholder
        
        return render_template('operations/view_edit_shipments.html',
                             shipments=shipments)
    except Exception as e:
        flash(f'Error loading shipments: {str(e)}', 'error')
        return redirect(url_for('operations.dashboard'))


@operations.route('/delete-shipment/<int:shipment_id>', methods=['POST'])
def delete_shipment(shipment_id):
    """Delete a shipment"""
    try:
        # TODO: Implement shipment deletion
        # shipment = Shipment.query.get_or_404(shipment_id)
        # db.session.delete(shipment)
        # db.session.commit()
        flash('Shipment deletion functionality coming soon!', 'info')
        return redirect(url_for('operations.view_shipments'))
    except Exception as e:
        flash(f'Error deleting shipment: {str(e)}', 'error')
        return redirect(url_for('operations.view_shipments'))
    
@operations.route('/schedule')
def schedule():
    """Renders the schedule calendar page."""
    return render_template('operations/schedule.html')