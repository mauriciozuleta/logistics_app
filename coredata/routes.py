
from flask import Blueprint, render_template, request, redirect, url_for, jsonify
from app import db
from models import Product, Country, Aircraft, Airport, Trader
from coredata.forms import AircraftForm, AirportForm, TraderForm

coredata_bp = Blueprint("coredata", __name__, template_folder="templates")


# Add Trader
@coredata_bp.route('/add-trader', methods=['GET', 'POST'])
def add_trader():
    countries = Country.query.order_by(Country.country_name).all()
    country_choices = [(c.country_code, f"{c.country_name} ({c.country_code})") for c in countries]
    edit_id = request.args.get('edit_id') or request.form.get('edit_id')
    trader = Trader.query.get(edit_id) if edit_id else None
    if request.method == 'POST':
        form = TraderForm(request.form)
        form.country_id.choices = country_choices
        if form.validate_on_submit():
            if trader:
                form.populate_obj(trader)
            else:
                trader = Trader()
                form.populate_obj(trader)
                db.session.add(trader)
            db.session.commit()
            return redirect(url_for('coredata.view_edit_traders'))
    else:
        if trader:
            form = TraderForm(obj=trader)
        else:
            form = TraderForm()
        form.country_id.choices = country_choices
    return render_template('coredata/add_trader.html', form=form, edit_id=edit_id)

# View/Edit Traders
@coredata_bp.route('/view-edit-traders')
def view_edit_traders():
    trader_list = Trader.query.all()
    return render_template('coredata/view_edit_traders.html', trader_list=trader_list)

# Delete Trader
@coredata_bp.route('/delete-trader/<int:trader_id>')
def delete_trader(trader_id):
    trader = Trader.query.get_or_404(trader_id)
    db.session.delete(trader)
    db.session.commit()
    return redirect(url_for('coredata.view_edit_traders'))



# View/Edit Airport list
@coredata_bp.route('/view-edit-airport')
def view_edit_airport():
    airport_list = Airport.query.all()
    return render_template('coredata/view_edit_airport.html', airport_list=airport_list)

# Delete multiple airports (AJAX)
@coredata_bp.route('/delete-multiple-airports', methods=['POST'])
def delete_multiple_airports():
    ids = request.json.get('ids', [])
    if not ids:
        return jsonify({'success': False, 'error': 'No IDs provided'}), 400
    Airport.query.filter(Airport.id.in_(ids)).delete(synchronize_session=False)
    db.session.commit()
    return jsonify({'success': True})

# Add Airport
@coredata_bp.route('/add-airport', methods=['GET', 'POST'])
def add_airport():
    countries = Country.query.order_by(Country.country_name).all()
    country_choices = [(c.country_code, f"{c.country_name} ({c.country_code})") for c in countries]
    edit_id = request.args.get('edit_id') or request.form.get('edit_id')
    airport = Airport.query.get(edit_id) if edit_id else None
    if request.method == 'POST':
        form = AirportForm(request.form)
        form.country_id.choices = country_choices
        if form.validate_on_submit():
            # Fetch coordinates using OpenFlights data (local function, no API key required)
            iata = form.iata_code.data.strip().upper()
            latitude = None
            longitude = None
            if iata and len(iata) == 3:
                import requests, csv
                from io import StringIO
                API_URL = "https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat"
                try:
                    resp = requests.get(API_URL, timeout=10)
                    if resp.ok:
                        reader = csv.reader(StringIO(resp.text))
                        for fields in reader:
                            if len(fields) > 7 and fields[4].strip('"').upper() == iata:
                                try:
                                    latitude = float(fields[6])
                                    longitude = float(fields[7])
                                    break
                                except Exception:
                                    latitude = None
                                    longitude = None
                                    break
                except Exception:
                    latitude = None
                    longitude = None
            if airport:
                form.populate_obj(airport)
                airport.latitude = latitude
                airport.longitude = longitude
            else:
                airport = Airport()
                form.populate_obj(airport)
                airport.latitude = latitude
                airport.longitude = longitude
                db.session.add(airport)
            db.session.commit()
            return redirect(url_for('coredata.view_edit_airport'))
    else:
        if airport:
            form = AirportForm(obj=airport)
        else:
            form = AirportForm()
        form.country_id.choices = country_choices
    return render_template('coredata/add_airport.html', form=form, edit_id=edit_id)

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
    edit_id = request.args.get('edit_id') or request.form.get('edit_id')
    aircraft = Aircraft.query.get(edit_id) if edit_id else None
    if request.method == 'POST':
        form = AircraftForm(request.form)
        if form.validate_on_submit():
            if aircraft:
                form.populate_obj(aircraft)
            else:
                aircraft = Aircraft()
                form.populate_obj(aircraft)
                db.session.add(aircraft)
            db.session.commit()
            return redirect(url_for('coredata.view_edit_aircraft'))
    else:
        if aircraft:
            form = AircraftForm(obj=aircraft)
        else:
            # Generate new ID for new aircraft
            last_aircraft = Aircraft.query.filter(Aircraft.id.like('ACFT%')).order_by(Aircraft.id.desc()).first()
            if last_aircraft and last_aircraft.id[4:].isdigit():
                next_num = int(last_aircraft.id[4:]) + 1
            else:
                next_num = 1
            new_id = f"ACFT{next_num:02d}"
            form = AircraftForm(id=new_id)
    return render_template('coredata/add_aircraft.html', form=form, edit_id=edit_id)

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