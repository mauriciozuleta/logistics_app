
from flask import Blueprint, render_template, request, redirect, url_for, jsonify, json, flash
from extensions import db
from models import Product, Country, Aircraft, Airport, Branch, Region, CountryTradeInfo, CompetitivePrice
from sqlalchemy.orm import joinedload
from coredata.forms import AircraftForm, AirportForm, ProductForm, CountryTradeInfoForm

coredata_bp = Blueprint("coredata", __name__, template_folder="templates")

@coredata_bp.route('/api/branches_by_country')
def branches_by_country():
    country_code = request.args.get('country_code')
    # Find CountryTradeInfo for this country
    cti = CountryTradeInfo.query.filter_by(country_id=country_code).first()
    result = []
    if cti:
        for b in cti.branches:
            result.append({
                'city': b.city,
                'port_name': b.name,
                'airport_iata': b.airport_iata
            })
    return jsonify(result)


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
# ...existing code...

# This route was lost due to file duplication. Adding it back as it's being called by the frontend.
@coredata_bp.route('/api/country_branch_info')
def country_branch_info():
    country_code = request.args.get('country_code')
    cti = CountryTradeInfo.query.filter_by(country_id=country_code).first()
    if cti:
        return jsonify({
            'exists': True,
            'export_sales_tax': cti.export_sales_tax or 0,
            'export_other_taxes': cti.export_other_taxes or 0,
            'export_profit_pct': cti.export_profit_pct or 0,
            'revenue_taxes': cti.revenue_taxes or 0,
            'import_taxes': cti.import_taxes or 0,
            'other_taxes': cti.other_taxes or 0,
            'import_profit_pct': cti.import_profit_pct or 0
        })
    else:
        return jsonify({
            'exists': False,
            'export_sales_tax': 0,
            'export_other_taxes': 0,
            'export_profit_pct': 0,
            'revenue_taxes': 0,
            'import_taxes': 0,
            'other_taxes': 0,
            'import_profit_pct': 0
        })

# ...existing code...

@coredata_bp.route('/country_branch', methods=['GET', 'POST'])
def country_branch():
    # This route seems to be a duplicate or older version of regional_management.
    # Let's keep it simple for now.
    # TraderForm removed. Update to use CountryTradeInfoForm or other form as needed.
    regions = db.session.query(Country.region).distinct().order_by(Country.region).all()
    region_choices = [r[0] for r in regions if r[0]]
    return render_template('coredata/country_branch.html', edit_id=None, regions=region_choices)

@coredata_bp.route('/traders/Regional_Management', methods=['GET', 'POST'])
def regional_management():
    # TraderForm removed. Update to use CountryTradeInfoForm or other form as needed.
    regions = db.session.query(Country.region).distinct().order_by(Country.region).all()
    region_choices = [r[0] for r in regions if r[0]]
    return render_template('coredata/add_Regional_control.html', region_choices=region_choices)

# This route handles the save_branch functionality for the regional branches management page
@coredata_bp.route('/save_branch', methods=['POST'])
def save_branch():
    data = request.get_json()
    print("Received data:", data)  # Debug print to see what's being received
    
    try:
        # Helper function to convert values to float or None if empty/invalid
        def to_float_or_none(value):
            if value is None or value == '':
                return None
            try:
                return float(value)
            except (ValueError, TypeError):
                return None
        
        # Create trader/branch directly from the data sent by frontend
        # Check if a manager exists for this region
        # Find or create Region
        region_name = data.get('region')
        manager_name = data.get('manager_name')
        region = Region.query.filter_by(name=region_name).first()
        if not region:
            region = Region(name=region_name, manager_name=manager_name)
            db.session.add(region)
            db.session.commit()

        # Find or create CountryTradeInfo
        country_id = data.get('country_id')
        cti = CountryTradeInfo.query.filter_by(country_id=country_id, region_id=region.id).first()
        if not cti:
            cti = CountryTradeInfo(
                country_id=country_id,
                region_id=region.id,
                export_sales_tax=to_float_or_none(data.get('export_sales_tax')),
                export_other_taxes=to_float_or_none(data.get('export_other_taxes')),
                export_profit_pct=to_float_or_none(data.get('export_profit_pct')),
                revenue_taxes=to_float_or_none(data.get('revenue_taxes')),
                import_taxes=to_float_or_none(data.get('import_taxes')),
                other_taxes=to_float_or_none(data.get('other_taxes')),
                import_profit_pct=to_float_or_none(data.get('import_profit_pct')),
                operational_cost_year=to_float_or_none(data.get('year_operation_cost'))
            )
            db.session.add(cti)
            db.session.commit()

        # Check for duplicate branch (same city and airport_iata)
        duplicate_branch = Branch.query.filter_by(city=data.get('city'), airport_iata=data.get('airport_iata'), country_trade_info_id=cti.id).first()
        if duplicate_branch:
            return jsonify({'success': False, 'error': 'Branch with this city and airport already exists.'}), 200

        branch = Branch(
            country_trade_info_id=cti.id,
            type_of_freight=data.get('type_of_freight'),
            airport_iata=data.get('airport_iata'),
            ground_terminal_code=data.get('ground_terminal_code'),
            name=data.get('port_name'),
            city=data.get('city')
        )
        db.session.add(branch)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Branch saved'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

# This route handles the save_branch functionality for the add_Regional_control page
@coredata_bp.route('/api/save_branch', methods=['POST'])
def api_save_branch():
    data = request.get_json()
    manager_data = data.get('manager_data')
    branch_data = data.get('branch_data')

    if not manager_data or not branch_data:
        return jsonify({'success': False, 'error': 'Missing manager or branch data'}), 400

    try:
        # Helper function to convert values to float or None if empty/invalid
        def to_float_or_none(value):
            if value is None or value == '':
                return None
            try:
                return float(value)
            except (ValueError, TypeError):
                return None
                
        # Find or create the manager (Trader with is_manager=True)
        # Find or create Region
        region_name = manager_data.get('region')
        manager_name = manager_data.get('manager_name')
        region = Region.query.filter_by(name=region_name).first()
        if not region:
            region = Region(name=region_name, manager_name=manager_name)
            db.session.add(region)
            db.session.commit()
        else:
            region.manager_name = manager_name
            db.session.commit()

        # Find or create CountryTradeInfo
        country_id = branch_data.get('countryCode')
        cti = CountryTradeInfo.query.filter_by(country_id=country_id, region_id=region.id).first()
        if not cti:
            cti = CountryTradeInfo(
                country_id=country_id,
                region_id=region.id,
                revenue_taxes=to_float_or_none(branch_data.get('revenue')),
                operational_cost_year=to_float_or_none(branch_data.get('opCost')),
                export_sales_tax=to_float_or_none(branch_data.get('exportSalesTax')),
                import_taxes=to_float_or_none(branch_data.get('importTaxes')),
                other_taxes=to_float_or_none(branch_data.get('otherTaxes'))
            )
            db.session.add(cti)
            db.session.commit()

        # Create the new branch
        branch = Branch(
            country_trade_info_id=cti.id,
            name=branch_data.get('city'),
            city=branch_data.get('city'),
            airport_iata=branch_data.get('airport'),
            type_of_freight=branch_data.get('type_of_freight')
        )
        db.session.add(branch)
        db.session.commit()

        return jsonify({
            'success': True, 
            'message': 'Branch saved successfully!',
            'branch': {
                'id': branch.id,
                'city': branch.city,
                'airport': branch.airport_iata,
                'countryCode': country_id,
                'countryName': branch.city
            }
        })
    except Exception as e:
        db.session.rollback()
        print(f"Error saving branch: {e}") # for debugging
        return jsonify({'success': False, 'error': str(e)}), 500
    except Exception as e:
        db.session.rollback()
        print(f"Error saving branch: {e}") # for debugging
        return jsonify({'success': False, 'error': str(e)}), 500
def api_branch_defaults_by_country():
    try:
        country_code = request.args.get('country_code', type=str)
        if not country_code:
            return jsonify(None)

        # Find the most recently created trader in that country to use as a default
        cti = CountryTradeInfo.query.filter_by(country_id=country_code).order_by(CountryTradeInfo.created_at.desc()).first()
        if cti:
            return jsonify({
                'revenue_taxes': cti.revenue_taxes,
                'export_sales_tax': cti.export_sales_tax,
                'import_taxes': cti.import_taxes,
                'other_taxes': cti.other_taxes,
            })
        return jsonify(None)
    except Exception as e:
        print(f"Error in api_branch_defaults_by_country: {e}")
        return jsonify(None)


@coredata_bp.route('/api/regional_manager_by_region')
def api_regional_manager_by_region():
    region = request.args.get('region', type=str)
    if not region:
        return jsonify({'manager_name': '', 'name': ''})

    try:
        # First, try to find a manager with is_manager=True
        region_obj = Region.query.filter_by(name=region).first()
        if region_obj:
            return jsonify({
                'id': region_obj.id,
                'manager_name': region_obj.manager_name or '',
                'name': region_obj.manager_name or '',
                'operational_cost_year': None
            })
        else:
            return jsonify({
                'id': None,
                'manager_name': '',
                'name': '',
                'operational_cost_year': None
            })
    except Exception as e:
        print(f"Error finding manager: {str(e)}")
        return jsonify({
            'id': None,
            'manager_name': '',
            'name': '',
            'operational_cost_year': None,
            'error': str(e)
        }), 500

@coredata_bp.route('/api/countries_by_region')
def api_countries_by_region():
    region = request.args.get('region', type=str)
    if not region:
        return jsonify([])

    countries = Country.query.filter_by(region=region).order_by(Country.country_name).all()
    country_list = [{'code': c.country_code, 'name': c.country_name} for c in countries]
    return jsonify(country_list)

@coredata_bp.route('/api/find_airports_for_city', methods=['GET'])
def find_airports_for_city():
    """
    Finds airport IATA codes for a given city or IATA code using the OpenFlights database.
    Checks which of those airports already exist in the local database.
    """
    # NOTE: This function makes a live web request on every call, which can be slow and unreliable.
    # For a production environment, this data should be cached or stored locally and updated periodically.

    city = request.args.get('city', type=str)
    country_code = request.args.get('country_code', type=str)
    iata_code_arg = request.args.get('iata', type=str)

    # Validate parameters
    if not iata_code_arg and (not city or not country_code):
        return jsonify({'error': 'City and country_code are required when not searching by IATA'}), 400

    country_name_to_match = None
    if country_code:
        country = Country.query.get(country_code)
        if not country:
            return jsonify([])  # Invalid country code
        country_name_to_match = country.country_name

    found_airports = []
    try:
        import requests, csv
        from io import StringIO
        API_URL = "https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat"
        resp = requests.get(API_URL, timeout=10)
        if resp.ok:
            existing_iatas = {a.iata_code for a in Airport.query.with_entities(Airport.iata_code).all()}
            
            # Create a lookup for country name to country code for efficiency
            country_name_map = {c.country_name.lower(): c.country_code for c in Country.query.all()}
            
            reader = csv.reader(StringIO(resp.text))
            for fields in reader:
                if len(fields) > 4:
                    iata = fields[4].strip('"')
                    name = fields[1].strip('"')
                    
                    if not iata or iata == r'\N':
                        continue

                    match = False
                    airport_city = fields[2].strip('"') # Get city from CSV
                    airport_country = fields[3].strip('"') # Get country from CSV

                    # Search by IATA code if provided
                    if iata_code_arg:
                        if iata.lower() == iata_code_arg.lower():
                            match = True
                    # Else, search by city and country
                    elif city and country_name_to_match:
                        if (airport_city.lower() == city.lower() and
                            airport_country.lower() == country_name_to_match.lower()):
                            match = True
                    
                    if match:
                        # Find the country code from our DB using the map
                        country_code_to_return = country_name_map.get(airport_country.lower())

                        found_airports.append({
                            'iata': iata,
                            'name': name,
                            'city': airport_city,
                            'exists': iata in existing_iatas,
                            'country_code': country_code_to_return
                        })
                        # If searching by IATA, we can stop after finding it.
                        if iata_code_arg:
                            break
    except Exception as e:
        print(f"Error fetching airport data for {city or iata_code_arg}: {e}")
        return jsonify({'error': 'Failed to fetch airport data'}), 500

    return jsonify(found_airports)
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


# View/Edit Traders



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

    # Pre-fill form from query parameters if they exist
    if request.method == 'GET':
        form.city.data = request.args.get('city', form.city.data)
        form.country_id.data = request.args.get('country_id', form.country_id.data)
        form.iata_code.data = request.args.get('iata_code', form.iata_code.data)
        form.name.data = request.args.get('name', form.name.data)

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

@coredata_bp.route('/regional-branches-management')
def regional_branches_management():
    regions = db.session.query(Country.region).distinct().order_by(Country.region).all()
    region_choices = [r[0] for r in regions if r[0]]
    return render_template('coredata/regional_branches_management.html', region_choices=region_choices)