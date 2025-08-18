import requests
from flask import Blueprint, request, jsonify

if __name__ == "__main__":
    import sys
    currency = sys.argv[1] if len(sys.argv) > 1 else "COP"
    url = f'https://api.frankfurter.app/latest?from={currency}&to=USD'
    try:
        resp = requests.get(url)
        data = resp.json()
        print("Full API response:", data)
        rate = None
        # Frankfurter returns rates as: {'rates': {'USD': <value>}, ...}
        if 'rates' in data and isinstance(data['rates'], dict):
            rate = data['rates'].get('USD')
            print("Available rates:", data['rates'])
        print(f"Exchange rate {currency} to USD: {rate}")
    except Exception as e:
        print(f"Error: {e}")

import requests
from flask import Blueprint, request, jsonify

exchange_api = Blueprint('exchange_api', __name__)

# Example using exchangerate.host (free, no API key required)
@exchange_api.route('/get_exchange_rate', methods=['GET'])
def get_exchange_rate():
    currency = request.args.get('currency', 'COP')
    # Default to COP if not provided
    url = f'https://api.exchangerate.host/latest?base={currency}&symbols=USD'
    try:
        resp = requests.get(url)
        data = resp.json()
        rate = data['rates']['USD'] if 'rates' in data and 'USD' in data['rates'] else None
        return jsonify({'rate': rate})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
