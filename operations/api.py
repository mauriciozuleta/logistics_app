from flask import Blueprint, request, jsonify
from models import Branch, CountryTradeInfo, Region, Country
from extensions import db

# Minimal placeholder blueprint for operations API
operations_api_new = Blueprint('operations_api_new', __name__)

@operations_api_new.route('/ping-test')
def ping():
	return jsonify({'message': 'operations_api_new is alive'})

@operations_api_new.route('/trader-info')
def trader_info():
    port_code = request.args.get('port_code')
    if not port_code:
        return jsonify({'error': 'Missing port_code'}), 400

    branch = Branch.query.filter(
        (Branch.airport_iata == port_code) |
        (Branch.ground_terminal_code == port_code)
    ).first()
    if not branch:
        return jsonify({'error': 'Branch not found'}), 404

    country_trade_info = branch.country_trade_info
    country = country_trade_info.country if country_trade_info else None
    region = country_trade_info.region if country_trade_info else None

    # Build the object with all relevant data
    result = {
        'branch': f"{branch.city or ''} / {branch.name or ''}",
        'country': country.country_name if country else '',
        'region': region.name if region else '',
        'manager': region.manager_name if region else '',
        'branch_id': branch.id,
        'branch_code': branch.branch_code,
        'branch_city': branch.city,
        'branch_name': branch.name,
        'type_of_freight': branch.type_of_freight,
        'airport_iata': branch.airport_iata,
        'ground_terminal_code': branch.ground_terminal_code,
        'country_trade_info_id': branch.country_trade_info_id,
        'country_id': country.country_code if country else '',
        'currency_code': country.currency_code if country else '',
        'region_id': region.id if region else '',
        'region_manager': region.manager_name if region else '',
    }
    # Add all country_trade_info fields
    if country_trade_info:
        for col in CountryTradeInfo.__table__.columns:
            result[col.name] = getattr(country_trade_info, col.name)
    print('DEBUG: Trader Info Object:', result)
    return jsonify(result)
