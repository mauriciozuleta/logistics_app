from flask import Blueprint, request, jsonify
from models import db, CountryTradeInfo

coredata_api = Blueprint('coredata_api', __name__)

@coredata_api.route('/api/update_country_trade_info', methods=['POST'])
def update_country_trade_info():
    data = request.json
    country_code = data.get('country_code')
    if not country_code:
        return jsonify({'success': False, 'error': 'No country_code provided'}), 400
    cti = CountryTradeInfo.query.filter_by(country_id=country_code).first()
    if not cti:
        return jsonify({'success': False, 'error': 'CountryTradeInfo not found'}), 404
    # Update fields if present
    for field in [
        'export_sales_tax', 'export_other_tax', 'country_profit', 'country_revenue_tax',
        'import_taxes', 'other_taxes', 'country_import_profit']:
        if field in data:
            try:
                setattr(cti, field, float(data[field]) if data[field] != '' else None)
            except Exception:
                setattr(cti, field, None)
    db.session.commit()
