from flask import Blueprint, render_template, request, redirect, url_for
from app import db
from models import Product, Country
from flask import jsonify

coredata_bp = Blueprint("coredata", __name__, template_folder="templates")

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