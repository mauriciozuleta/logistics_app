# View/Edit Airport list
@coredata_bp.route('/view-edit-airport')
def view_edit_airport():
    from models import Airport
    airport_list = Airport.query.all()
    return render_template('coredata/view_edit_airport.html', airport_list=airport_list)

# Delete multiple airports (AJAX)
@coredata_bp.route('/delete-multiple-airports', methods=['POST'])
def delete_multiple_airports():
    from models import Airport
    ids = request.json.get('ids', [])
    if not ids:
        return jsonify({'success': False, 'error': 'No IDs provided'}), 400
    Airport.query.filter(Airport.id.in_(ids)).delete(synchronize_session=False)
    db.session.commit()
    return jsonify({'success': True})
from models import Airport
from coredata.forms import AirportForm
# Add Airport
@coredata_bp.route('/add-airport', methods=['GET', 'POST'])
def add_airport():
    # Populate country dropdown (country_code, country_name)
    countries = Country.query.order_by(Country.country_name).all()
    country_choices = [(c.country_code, f"{c.country_name} ({c.country_code})") for c in countries]
    form = AirportForm()
    form.country_id.choices = country_choices

    if form.validate_on_submit():
        airport = Airport(
            name=form.name.data,
            iata_code=form.iata_code.data.upper(),
            city=form.city.data,
            country_id=form.country_id.data,
            fuel_cost_gl=form.fuel_cost_gl.data,
            cargo_handling_cost_kg=form.cargo_handling_cost_kg.data,
            airport_fee=form.airport_fee.data,
            turnaround_cost=form.turnaround_cost.data,
            other_desc=form.other_desc.data,
            other_cost=form.other_cost.data,
            latitude=form.latitude.data,
            longitude=form.longitude.data,
            geo_source=form.geo_source.data
        )
        db.session.add(airport)
        db.session.commit()
        return redirect(url_for('coredata.view_edit_airport'))
    return render_template('coredata/add_airport.html', form=form)

from flask import Blueprint, render_template, request, redirect, url_for
from app import db
from models import Product, Country, Aircraft
from flask import jsonify

coredata_bp = Blueprint("coredata", __name__, template_folder="templates")

# View/Edit Aircraft list
@coredata_bp.route('/view-edit-aircraft')
def view_edit_aircraft():
    aircraft_list = Aircraft.query.all()
    return render_template('coredata/view_edit_aircraft.html', aircraft_list=aircraft_list)

# Delete multiple aircraft (AJAX)
@coredata_bp.route('/delete-multiple-aircraft', methods=['POST'])
def delete_multiple_aircraft():
    ids = request.json.get('ids', [])
    if not ids:
        return jsonify({'success': False, 'error': 'No IDs provided'}), 400
    Aircraft.query.filter(Aircraft.id.in_(ids)).delete(synchronize_session=False)
    db.session.commit()
    return jsonify({'success': True})

# Utility: Safe type casting
def parse_float_or_none(val):
    try:
        return float(val.strip()) if val and val.strip() else None
    except ValueError:
        return None

def parse_int_or_none(val):
    try:
        return int(val.strip()) if val and val.strip() else None
    except ValueError:
        return None


# Aircraft add form
from coredata.forms import AircraftForm
@coredata_bp.route('/add-aircraft', methods=['GET', 'POST'])
def add_aircraft():
    # Only generate a new ID if GET (new form), not POST (preserve user input)
    if request.method == 'GET':
        # Find the highest existing ACFT number and increment
        last_aircraft = Aircraft.query.filter(Aircraft.id.like('ACFT%')).order_by(Aircraft.id.desc()).first()
        if last_aircraft and last_aircraft.id[4:].isdigit():
            next_num = int(last_aircraft.id[4:]) + 1
        else:
            next_num = 1
        new_id = f"ACFT{next_num:02d}"
        form = AircraftForm(id=new_id)
    else:
        # On POST, always set the id from the submitted value (readonly field is included in POST)
        form = AircraftForm(id=request.form.get('id'))
    if form.validate_on_submit():
        aircraft = Aircraft(
            id=form.id.data,
            manufacturer=form.manufacturer.data,
            model=form.model.data,
            short_name=form.short_name.data,
            mtow_kg=form.mtow_kg.data,
            mtow_lbs=form.mtow_lbs.data,
            mldgw_kg=form.mldgw_kg.data,
            mldgw_lbs=form.mldgw_lbs.data,
            zero_fuel_kg=form.zero_fuel_kg.data,
            zero_fuel_lbs=form.zero_fuel_lbs.data,
            max_ramp_kg=form.max_ramp_kg.data,
            max_ramp_lbs=form.max_ramp_lbs.data,
            empty_weight_kg=form.empty_weight_kg.data,
            empty_weight_lbs=form.empty_weight_lbs.data,
            max_payload_kg=form.max_payload_kg.data,
            max_payload_lbs=form.max_payload_lbs.data,
            fuel_capacity_gal=form.fuel_capacity_gal.data,
            fuel_capacity_lbs=form.fuel_capacity_lbs.data,
            fuel_burn_gal=form.fuel_burn_gal.data,
            fuel_burn_lbs=form.fuel_burn_lbs.data,
            min_fuel_landed_gal=form.min_fuel_landed_gal.data,
            min_fuel_landed_lbs=form.min_fuel_landed_lbs.data,
            min_fuel_alternate_gal=form.min_fuel_alternate_gal.data,
            min_fuel_alternate_lbs=form.min_fuel_alternate_lbs.data,
            cargo_positions_main_deck=form.cargo_positions_main_deck.data,
            cargo_positions_lower_deck=form.cargo_positions_lower_deck.data,
            acmi_cost=form.acmi_cost.data,
        )
        db.session.add(aircraft)
        db.session.commit()
        return redirect(url_for('coredata.view_edit_aircraft'))
    return render_template('coredata/add_aircraft.html', form=form)

# Dashboard page
@coredata_bp.route('/dashboard')
def dashboard():
    return render_template('coredata/coredata_dashboard.html')

# Add or Edit product form (unified logic)
@coredata_bp.route('/add-product', methods=['GET', 'POST'])
def add_product():
    countries = Country.query.all()
    products = Product.query.all()

    # Check edit_id from GET or POST to support redirects and updates
    edit_id = request.args.get('edit_id', type=int) or request.form.get('edit_id', type=int)
    existing_product = Product.query.get(edit_id) if edit_id else None

    if request.method == 'POST':
        # Parse fields from form
        product_type = request.form.get('product_type')
        name = request.form.get('name')
        country_id = request.form.get('country_id')
        trade_unit = parse_int_or_none(request.form.get('trade_unit'))
        fca_cost_per_wu = parse_float_or_none(request.form.get('fca_cost_per_wu'))
        packaging = request.form.get('packaging')
        packaging_weight = parse_float_or_none(request.form.get('packaging_weight'))
        packaging_cost = parse_float_or_none(request.form.get('packaging_cost'))
        units_per_pack = parse_int_or_none(request.form.get('units_per_pack'))
        currency = request.form.get('currency')
        other_info = request.form.get('other_info')

        if existing_product:
            # Update product
            existing_product.product_type = product_type
            existing_product.name = name
            existing_product.country_id = country_id
            existing_product.trade_unit = trade_unit
            existing_product.fca_cost_per_wu = fca_cost_per_wu
            existing_product.packaging = packaging
            existing_product.packaging_weight = packaging_weight
            existing_product.packaging_cost = packaging_cost
            existing_product.units_per_pack = units_per_pack
            existing_product.currency = currency
            existing_product.other_info = other_info

        else:
            # Check for duplicate (only for new records)
            duplicate = Product.query.filter_by(name=name, country_id=country_id).first()
            if duplicate and not request.form.get("force_submit"):
                return render_template(
                    'coredata/add_product.html',
                    countries=countries,
                    products=products,
                    duplicate=True,
                    duplicate_name=duplicate.name,
                    duplicate_country=duplicate.country.country_name,
                    request_form=request.form
                )

            # Create new product
            product = Product(
                product_type=product_type,
                name=name,
                country_id=country_id,
                trade_unit=trade_unit,
                fca_cost_per_wu=fca_cost_per_wu,
                packaging=packaging,
                packaging_weight=packaging_weight,
                packaging_cost=packaging_cost,
                units_per_pack=units_per_pack,
                currency=currency,
                other_info=other_info
            )
            db.session.add(product)

        db.session.commit()
        return redirect(url_for('coredata.view_edit_product'))

    return render_template(
        'coredata/add_product.html',
        countries=countries,
        products=products,
        product=existing_product,
        edit_id=edit_id  # Pass to form for hidden field
    )

# Delete single product
@coredata_bp.route('/delete-multiple-products', methods=['POST'])
def delete_multiple_products():
    data = request.get_json()
    ids = data.get('ids', [])

    if not ids:
        return jsonify({"error": "No IDs received"}), 400

    for product_id in ids:
        product = Product.query.get(product_id)
        if product:
            db.session.delete(product)

    db.session.commit()
    return jsonify({"message": "Products deleted successfully"}), 200

# View/edit product list page
@coredata_bp.route('/view-edit-product')
def view_edit_product():
    products = Product.query.order_by(Product.name.asc()).all()
    return render_template('coredata/view_edit_product.html', products=products)