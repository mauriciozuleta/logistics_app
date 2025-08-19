from flask import Blueprint, render_template, request, redirect, url_for, jsonify
from extensions import db
from models import Product, Country, Aircraft, Airport, Trader
from models import CompetitivePrice
from coredata.forms import AircraftForm, AirportForm, TraderForm, ProductForm

coredata_bp = Blueprint("coredata", __name__, template_folder="templates")

@coredata_bp.route('/competitive_prices')
def competitive_prices():
    from models import CompetitivePrice
    country = request.args.get('country')
    products = []
    product_data = []
    if country:
        products = Product.query.join(Country, Product.country_id == Country.country_code)\
            .filter(Country.country_name != country).all()
        for product in products:
            saved = CompetitivePrice.query.filter_by(product_id=product.id, country=country).first()
            product_data.append({
                'id': product.id,
                'product_code': product.product_code,
                'name': product.name,
                'origin': product.country.country_name if product.country else '-',
                'trade_unit': product.trade_unit,
                'price_to_compare': saved.price_to_compare if saved else '',
                'updated_date': saved.updated_date.strftime('%Y-%m-%d') if saved and saved.updated_date else '-',
            })
    return render_template('coredata/competitive_prices.html', country=country, products=product_data)

@coredata_bp.route('/save_competitive_prices', methods=['POST'])
def save_competitive_prices():
    print('DEBUG: Route hit')
    import datetime
    data = request.get_json(force=True)
    country = data.get('country')
    prices = data.get('prices', [])
    errors = []
    print('DEBUG: Received prices:', prices)
    for item in prices:
        try:
            print('DEBUG: Processing item:', item)
            product_id = int(item['product_id'])
            product_code = item['product_code']
            origin = item['origin']
            price_to_compare = item['price_to_compare']
            updated_date = item['updated_date']
            # Validate required fields
            if not (product_id and product_code and country and origin and price_to_compare and updated_date):
                errors.append(f"Missing data for product_id {product_id}")
                print('DEBUG: Missing data for', product_id)
                continue
            # Convert price_to_compare to float
            try:
                price_to_compare = float(price_to_compare)
            except Exception:
                errors.append(f"Invalid price for product_id {product_id}")
                print('DEBUG: Invalid price for', product_id)
                continue
            # Convert updated_date to datetime.date if string
            if isinstance(updated_date, str):
                try:
                    updated_date = datetime.datetime.strptime(updated_date, '%Y-%m-%d').date()
                except Exception:
                    errors.append(f"Invalid date for product_id {product_id}")
                    print('DEBUG: Invalid date for', product_id, updated_date)
                    continue
            cp = CompetitivePrice.query.filter_by(product_id=product_id, country=country).first()
            if cp:
                cp.price_to_compare = price_to_compare
                cp.updated_date = updated_date
            else:
                cp = CompetitivePrice(
                    product_id=product_id,
                    product_code=product_code,
                    country=country,
                    origin=origin,
                    price_to_compare=price_to_compare,
                    updated_date=updated_date
                )
                db.session.add(cp)
        except Exception as e:
            errors.append(str(e))
            print('DEBUG: Exception:', str(e))
    db.session.commit()
    if errors:
        print('DEBUG: Errors:', errors)
        return jsonify({'message': 'Some prices failed to save.', 'errors': errors}), 400
    return jsonify({'message': 'Competitive prices saved successfully.'})
def _generate_next_code(model, field_name, prefix):
    """Generates the next sequential code for a given model and prefix."""
    prefix_len = len(prefix)
    field = getattr(model, field_name)
    
    last_item = model.query.filter(field.like(f'{prefix}%')).order_by(field.desc()).first()
    last_code = getattr(last_item, field_name) if last_item else None
    
    if last_code and last_code[prefix_len:].isdigit():
        next_num = int(last_code[prefix_len:]) + 1
    else:
        next_num = 1
        
    padding = 2 if prefix == "ACFT" else 3
    return f"{prefix}{next_num:0{padding}d}"

# Add Trader
@coredata_bp.route('/add-trader', methods=['GET', 'POST'])
def add_trader():
    edit_id = request.args.get('edit_id') or request.form.get('edit_id')
    trader = Trader.query.get(edit_id) if edit_id else None
    form = TraderForm(obj=trader)

    countries = Country.query.order_by(Country.country_name).all()
    form.country_id.choices = [(c.country_code, f"{c.country_name} ({c.country_code})") for c in countries]

    if form.validate_on_submit():
        if not trader:
            trader = Trader()
            db.session.add(trader)

        form.populate_obj(trader)

        if not trader.trader_code or trader.trader_code.strip() == '':
            trader.trader_code = _generate_next_code(Trader, 'trader_code', 'TR')

        db.session.commit()
        return redirect(url_for('coredata.view_edit_traders'))

    if request.method == 'GET' and not trader:
        form.trader_code.data = _generate_next_code(Trader, 'trader_code', 'TR')

    return render_template('coredata/add_trader.html', form=form, edit_id=edit_id)

# View/Edit Traders
@coredata_bp.route('/view-edit-traders')
def view_edit_traders():
    trader_list = Trader.query.all()
    return render_template('coredata/view_edit_traders.html', trader_list=trader_list)

# Debug Traders
@coredata_bp.route('/debug-traders')
def debug_traders():
    trader_list = Trader.query.all()
    return render_template('coredata/debug_traders.html', trader_list=trader_list)

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

# Delete single airport
@coredata_bp.route('/delete-airport/<int:airport_id>')
def delete_airport(airport_id):
    airport = Airport.query.get_or_404(airport_id)
    db.session.delete(airport)
    db.session.commit()
    return redirect(url_for('coredata.view_edit_airport'))

# Add Airport
@coredata_bp.route('/add-airport', methods=['GET', 'POST'])
def add_airport():
    edit_id = request.args.get('edit_id') or request.form.get('edit_id')
    airport = Airport.query.get(edit_id) if edit_id else None
    form = AirportForm(obj=airport)

    countries = Country.query.order_by(Country.country_name).all()
    form.country_id.choices = [(c.country_code, f"{c.country_name} ({c.country_code})") for c in countries]

    if form.validate_on_submit():
        # Fetch coordinates and altitude using OpenFlights data
        iata = form.iata_code.data.strip().upper()
        latitude, longitude, altitude_ft = None, None, None
        if iata and len(iata) == 3:
            import requests, csv
            from io import StringIO
            API_URL = "https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat"
            try:
                resp = requests.get(API_URL, timeout=10)
                if resp.ok:
                    reader = csv.reader(StringIO(resp.text))
                    for fields in reader:
                        if len(fields) > 8 and fields[4].strip('"').upper() == iata:
                            latitude = float(fields[6]) if fields[6] else None
                            longitude = float(fields[7]) if fields[7] else None
                            altitude_ft = float(fields[8]) if fields[8] and fields[8] != '\\N' else None
                            break
            except Exception as e:
                print(f"Could not fetch airport data for {iata}: {e}")

        if not airport:
            airport = Airport()
            db.session.add(airport)

        form.populate_obj(airport)
        airport.latitude = latitude
        airport.longitude = longitude
        airport.altitude_ft = altitude_ft

        db.session.commit()
        return redirect(url_for('coredata.view_edit_airport'))

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

# Aircraft add form
@coredata_bp.route('/add-aircraft', methods=['GET', 'POST'])
def add_aircraft():
    edit_id = request.args.get('edit_id') or request.form.get('edit_id')
    aircraft = Aircraft.query.get(edit_id) if edit_id else None
    form = AircraftForm(obj=aircraft)

    if form.validate_on_submit():
        if not aircraft:
            aircraft = Aircraft()
            db.session.add(aircraft)

        form.populate_obj(aircraft)
        db.session.commit()
        return redirect(url_for('coredata.view_edit_aircraft'))

    if request.method == 'GET' and not aircraft:
        form.id.data = _generate_next_code(Aircraft, 'id', 'ACFT')

    return render_template('coredata/add_aircraft.html', form=form, edit_id=edit_id)

# Dashboard page
@coredata_bp.route('/dashboard')
def dashboard():
    return render_template('coredata/coredata_dashboard.html')

# Add or Edit product form (unified logic)
@coredata_bp.route('/add-product', methods=['GET', 'POST'])
def add_product():
    countries = Country.query.all()
    country_choices = [(c.country_code, f"{c.country_name} ({c.country_code})") for c in countries]

    edit_id = request.args.get('edit_id', type=int) or request.form.get('edit_id', type=int)
    product = Product.query.get(edit_id) if edit_id else None
    form = ProductForm(obj=product)
    form.country_id.choices = country_choices

    if form.validate_on_submit():
        if not product: # This is a new product
            # Check for duplicate
            duplicate = Product.query.filter_by(name=form.name.data, country_id=form.country_id.data).first()
            if duplicate and not request.form.get("force_submit"):
                 # Repopulate choices before rendering the form again
                 form.country_id.choices = country_choices
                 return render_template('coredata/add_product.html', 
                                       form=form, 
                                       edit_id=edit_id,
                                       duplicate=True, duplicate_name=duplicate.name,
                                       duplicate_country=duplicate.country.country_name,
                                       countries=countries,
                                       product=product)

            product = Product()
            form.populate_obj(product)
            product.product_code = _generate_next_code(Product, 'product_code', 'PROD')
            db.session.add(product)
            print(f"DEBUG: Created new product {product.product_code} with name '{product.name}'")
        else: # This is an existing product
            form.populate_obj(product)
            if not product.product_code or product.product_code.strip() == '':
                product.product_code = _generate_next_code(Product, 'product_code', 'PROD')
            print(f"DEBUG: Updated product {product.id} (code: {product.product_code}) with name '{product.name}'")

        db.session.commit()
        return redirect(url_for('coredata.view_edit_product'))

    if request.method == 'GET':
        if not product:
            # Pre-populate the form with a new product code
            new_code = _generate_next_code(Product, 'product_code', 'PROD')
            form.product_code.data = new_code

    # For rendering the template, we pass the form and edit_id
    return render_template('coredata/add_product.html', 
                           form=form, 
                           edit_id=edit_id,
                           countries=countries,
                           product=product)

# Delete multiple products
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

# Delete single product
@coredata_bp.route('/delete-product/<int:product_id>')
def delete_product(product_id):
    product = Product.query.get_or_404(product_id)
    db.session.delete(product)
    db.session.commit()
    return redirect(url_for('coredata.view_edit_product'))

# View/edit product list page
@coredata_bp.route('/view-edit-product')
def view_edit_product():
    # Get pagination parameters
    page = request.args.get('page', 1, type=int)
    per_page = 8  # Display 8 products per page
    
    # Get filter parameters
    product_type_filter = request.args.get('product_type', '')
    
    # Get route information from query parameters for adding cargo to specific routes
    route_type = request.args.get('route_type', '')
    route_info = request.args.get('route_info', '')
    from_airport = request.args.get('from_airport', '')
    to_airport = request.args.get('to_airport', '')
    
    # Build query with optional filtering
    query = Product.query
    if product_type_filter:
        query = query.filter(Product.product_type == product_type_filter)
    
    # Paginate products
    products = query.order_by(Product.name.asc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    # Get available product types for filter dropdown
    available_types = db.session.query(Product.product_type).distinct().filter(Product.product_type.isnot(None)).all()
    product_types = [t[0] for t in available_types if t[0]]  # Extract values and filter out None
    product_types.sort()  # Sort alphabetically
    
    return render_template('coredata/view_edit_product.html', 
                         products=products,
                         product_list=products.items,  # Keep backward compatibility
                         product_types=product_types,
                         current_filter=product_type_filter,
                         route_type=route_type,
                         route_info=route_info,
                         from_airport=from_airport,
                         to_airport=to_airport)