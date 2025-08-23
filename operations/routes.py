import json
from flask import Blueprint, render_template, request, jsonify, flash, redirect, url_for
from flask_wtf.csrf import generate_csrf
from models import Airport, Aircraft, Route, Shipment
from operations.flight_distances_db import calculate_distance_db
from sqlalchemy.orm import joinedload
from extensions import db

def generate_product_code(product_type):
    prefix = product_type[:2].upper()
    # Count existing products of this type
    from models import Product
    count = Product.query.filter(Product.product_type == product_type).count() + 1
    return f"{prefix}{str(count).zfill(3)}"

operations = Blueprint("operations", __name__, template_folder="templates")
operations_api = Blueprint("operations_api", __name__)

# Add the shipment_management route after Blueprint definition
@operations.route('/shipments', methods=['GET', 'POST'])
def shipment_management():
    from models import RegionalManager, Trader, Country, Airport

    # Eagerly load the regional_manager relationship to prevent N+1 queries
    branches = Trader.query.options(joinedload(Trader.regional_manager)).order_by(Trader.city).all()

    regions = [r.region for r in RegionalManager.query.order_by(RegionalManager.region).distinct()]
    countries = Country.query.order_by(Country.country_name).all()
    airports = Airport.query.order_by(Airport.name).all()

    # Prepare lists for dropdowns
    region_list = regions
    country_list = [{"code": c.country_code, "name": c.country_name, "region": c.region} for c in countries]
    branch_list = [{
        "id": b.id, "name": b.name or b.city, "city": b.city, "country_id": b.country_id,
        "regional_manager_id": b.regional_manager_id, "airport_iata": b.airport_iata,
        "regional_manager_name": b.regional_manager.name if b.regional_manager else ''
    } for b in branches]
    airport_list = [{"id": a.id, "name": a.name, "iata_code": a.iata_code, "city": a.city, "country_id": a.country_id} for a in airports]

    csrf_token = generate_csrf()

    return render_template(
        'operations/shippment_management.html',
        csrf_token=csrf_token,
        region_list=region_list,
        country_list=country_list,
        branch_list=branch_list,
        airport_list=airport_list
    )

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
def add_route():
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
                # Create separate records for each leg
                # Since we removed edit, we only handle new route creation
                if route_type == 'one-way':
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
                            total_adjusted_flight_time_hours=leg1_data.get('adjusted_flight_time_hours', 0),
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
                            total_adjusted_flight_time_hours=leg1_data.get('adjusted_flight_time_hours', 0),
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
                            total_adjusted_flight_time_hours=leg2_data.get('adjusted_flight_time_hours', 0),
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
                            total_adjusted_flight_time_hours=leg1_data.get('adjusted_flight_time_hours', 0),
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
                            total_adjusted_flight_time_hours=leg2_data.get('adjusted_flight_time_hours', 0),
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
    
    return render_template('operations/add_route.html', 
                         airport_choices=airport_choices, 
                         aircraft_choices=aircraft_choices)

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

@operations_api.route('/check-route', methods=['POST'])
def check_route():
    """
    Checks if a route exists between two airports based on their IATA codes.
    Accepts a JSON payload with 'departure_iata' and 'arrival_iata'.
    """
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Missing JSON in request'}), 400

    departure_iata = data.get('departure_iata')
    arrival_iata = data.get('arrival_iata')

    if not departure_iata or not arrival_iata:
        return jsonify({'error': 'Missing departure or arrival IATA code'}), 400

    # Find the corresponding airport IDs from the IATA codes
    from models import Airport, Route
    departure_airport = Airport.query.filter_by(iata_code=departure_iata).first()
    arrival_airport = Airport.query.filter_by(iata_code=arrival_iata).first()

    # If either airport doesn't exist, the route cannot exist.
    if not departure_airport or not arrival_airport:
        return jsonify({'exists': False})

    # Query for the route using the airport IDs
    route = Route.query.filter_by(from_airport_id=departure_airport.id, to_airport_id=arrival_airport.id).first()

    if route:
        route_data = {
            'departure_route': f"{departure_airport.iata_code} - {arrival_airport.iata_code}"
        }
        return jsonify({'exists': True, 'route_data': route_data})
    else:
        return jsonify({'exists': False})

@operations_api.route('/product_prices', methods=['GET'])
def product_prices():
    """
    API endpoint to fetch competitive prices for a given consignee's country.
    """
    from models import Trader, CompetitivePrice, Country
    consignee_id = request.args.get('consignee_id')
    if not consignee_id:
        return jsonify({'error': 'Missing consignee_id parameter'}), 400

    consignee = Trader.query.get(consignee_id)
    if not consignee or not consignee.country_id:
        return jsonify({'error': 'Consignee or consignee country not found'}), 404

    country_obj = Country.query.get(consignee.country_id)
    if not country_obj:
        return jsonify({'error': 'Country for consignee not found'}), 404
    consignee_country_name = country_obj.country_name

    prices = CompetitivePrice.query.filter_by(country=consignee_country_name).all()
    price_map = {p.product_id: p.price_to_compare for p in prices}

    return jsonify(price_map)

# API endpoint to fetch routes as calendar events
@operations_api.route('/scheduled-shipments')
def scheduled_shipments():
    """
    Provides shipment/route data formatted for FullCalendar.
    """
    try:
        # For now, we will use Routes as the event source.
        # This can be changed to Shipments later.
        routes = Route.query.all()
        events = []
        for route in routes:
            events.append({
                'id': route.id,
                'title': route.route_summary or 'Unnamed Route',
                'start': route.created_at.isoformat() # Using created_at as the start date for now
            })
        return jsonify(events)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# =====================================
# SHIPMENT MANAGEMENT ROUTES
# =====================================

@operations.route('/add-shipment', methods=['GET', 'POST'])
@operations.route('/add-shipment/<int:shipment_id>', methods=['GET', 'POST'])
def add_shipment(shipment_id=None):
    """Add or edit a shipment"""
    from models import Trader, Product, Route, RegionalManager, Airport

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

    # --- Data for Dropdowns ---
    # Eagerly load relationships to prevent N+1 queries
    managers = RegionalManager.query.options(
        joinedload(RegionalManager.branches).joinedload(Trader.country)
    ).order_by(RegionalManager.region, RegionalManager.name).all()

    # Structure data for the new cascading dropdowns
    regions_with_branches = {}
    # Build a lookup for airports by IATA code for fast access
    airport_lookup = {a.iata_code: a for a in Airport.query.all()}
    for manager in managers:
        if manager.region not in regions_with_branches:
            regions_with_branches[manager.region] = {}
        for branch in manager.branches:
            if branch.country:
                country_name = branch.country.country_name
                if country_name not in regions_with_branches[manager.region]:
                    regions_with_branches[manager.region][country_name] = []
                # Get airport info from branch.airport_iata
                airport_iata = branch.airport_iata
                airport_name = None
                if airport_iata and airport_iata in airport_lookup:
                    airport_name = airport_lookup[airport_iata].name
                regions_with_branches[manager.region][country_name].append({
                    'id': branch.id,
                    'city': branch.city,
                    'name': branch.name or branch.city, # Fallback to city if name is null
                    'airport_iata': airport_iata,
                    'airport_name': airport_name
                })

    from models import Airport
    traders = Trader.query.order_by(Trader.trader_code).all()
    trader_choices = [(t.id, f"{t.trader_code} - {t.name} ({t.city})") for t in traders]


    products = Product.query.order_by(Product.name).all()
    consignee_id = request.form.get('consignee') or request.args.get('consignee')
    consignee_country = None
    if consignee_id:
        from models import Trader
        consignee = Trader.query.filter_by(id=consignee_id).first()
        if consignee:
            consignee_country = consignee.country_id

    # For each product, fetch the competitive price for the consignee's country
    products_dicts = []
    for p in products:
        price_to_compare = None
        if consignee_country:
            from models import CompetitivePrice
            cp = CompetitivePrice.query.filter_by(product_id=p.id, country=consignee_country).first()
            if cp:
                price_to_compare = cp.price_to_compare
        print(f"DEBUG: Product {p.id} ({p.name}) | Consignee Country: {consignee_country} | price_to_compare: {price_to_compare}")
        products_dicts.append({
            'id': p.id,
            'product_code': p.product_code,
            'name': p.name,
            'country_id': p.country_id,
            'trade_unit': p.trade_unit,
            'packaging': p.packaging,
            'packaging_weight': p.packaging_weight,
            'packaging_cost': p.packaging_cost,
            'currency': p.currency,
            'product_type': p.product_type,
            'units_per_pack': p.units_per_pack,
            'price_to_compare': price_to_compare if price_to_compare is not None else 0
        })


    product_choices = [(p.id, p.name) for p in products]

    # Eagerly load related aircraft and airport data to prevent N+1 query issues.
    # This assumes relationships 'from_airport' and 'to_airport' exist on the Route model.
    routes = Route.query.options(
        joinedload(Route.aircraft),
        joinedload(Route.from_airport),
        joinedload(Route.to_airport)
    ).order_by(Route.route_name).all()
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
        'airport_iata': t.airport_iata,
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
        from_airport = r.from_airport
        to_airport = r.to_airport

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

        aircraft_suffix = f" ({r.aircraft.short_name})" if r.aircraft else ""
        summary_text = r.route_summary or r.route_name or f"{from_airport.iata_code} → {to_airport.iata_code}"

        route_data[str(r.id)] = {
            'fromCity': from_airport.city if from_airport else '',
            'toCity': to_airport.city if to_airport else '',
            'fromAirport': from_airport.iata_code if from_airport else '',
            'toAirport': to_airport.iata_code if to_airport else '',
            'summary': f"{summary_text}{aircraft_suffix}",
            'aircraft': [r.aircraft.short_name] if r.aircraft and r.aircraft.short_name else [],
            'distance': distance_display,
            'flight_time': flight_time_display,
            'cost': r.total_cost,
            'payload': payload_display
        }

    # Ensure all variables are defined and JSON serializable
    regions_with_branches = regions_with_branches if regions_with_branches is not None else {}
    route_data = route_data if route_data is not None else {}
    airport_data = airport_data if airport_data is not None else {}
    trader_data = trader_data if trader_data is not None else {}
    products_dicts = products_dicts if products_dicts is not None else []

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
        products=products_dicts,
        regions_with_branches=regions_with_branches
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