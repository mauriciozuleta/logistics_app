import requests
import os
from flask import Blueprint, request, jsonify
from datetime import datetime

# Import our new exchange rate module
from data.exchange_rate import get_exchange_rate as get_rate, convert_amount

exchange_api = Blueprint('exchange_api', __name__)

@exchange_api.route('/get_exchange_rate', methods=['GET'])
def get_exchange_rate():
    """
    Get the exchange rate between two currencies.
    
    Query parameters:
        from_currency: Source currency code (3-letter ISO, default: USD)
        to_currency: Target currency code (3-letter ISO, default: USD)
        amount: Amount to convert (optional, default: 1.0)
        refresh: Force refresh of cached data (optional, default: false)
    
    Returns:
        JSON with exchange rate and converted amount
    """
    from_currency = request.args.get('from_currency', 'USD').upper()
    to_currency = request.args.get('to_currency', 'USD').upper()
    amount = float(request.args.get('amount', 1.0))
    refresh = request.args.get('refresh', 'false').lower() == 'true'
    
    # Get API key from environment
    api_key = os.environ.get('EXCHANGERATE_API_KEY')
    
    # Debug prints
    print(f"Exchange rate request: {from_currency} to {to_currency}, amount: {amount}, refresh: {refresh}")
    
    try:
        # Get the exchange rate
        rate = get_rate(
            from_currency=from_currency,
            to_currency=to_currency,
            api_key=api_key,
            force_refresh=refresh
        )
        
        # Calculate the converted amount
        converted_amount = amount * rate
        
        print(f"Exchange rate result: {rate}, converted amount: {converted_amount}")
        
        # Return the results
        return jsonify({
            'success': True,
            'from_currency': from_currency,
            'to_currency': to_currency,
            'rate': rate,
            'amount': amount,
            'converted_amount': converted_amount,
            'timestamp': datetime.now().isoformat(),
            'source': 'logistics_app_exchange_api'
        })
    except Exception as e:
        print(f"Exchange rate error: {str(e)}")
        
        # Provide hardcoded fallback rates for common currencies
        fallback_rates = {
            'USD_EUR': 0.85,
            'EUR_USD': 1.18,
            'GBP_USD': 1.37,
            'USD_GBP': 0.73,
            'JPY_USD': 0.0091,
            'USD_JPY': 110.0,
            'CAD_USD': 0.8,
            'USD_CAD': 1.25,
            'COP_USD': 0.00026,  # Colombian Peso to USD
            'USD_COP': 3850.0     # USD to Colombian Peso
        }
        
        # Try to use fallback rates
        rate_key = f"{from_currency}_{to_currency}"
        fallback_rate = fallback_rates.get(rate_key)
        
        if fallback_rate:
            converted_amount = amount * fallback_rate
            print(f"Using hardcoded fallback rate: {fallback_rate}")
            
            return jsonify({
                'success': True,
                'from_currency': from_currency,
                'to_currency': to_currency,
                'rate': fallback_rate,
                'amount': amount,
                'converted_amount': converted_amount,
                'timestamp': datetime.now().isoformat(),
                'source': 'hardcoded_fallback',
                'note': 'Using emergency fallback rate. Real-time data unavailable.'
            })
        
        # If no fallback available, return error
        return jsonify({
            'success': False,
            'error': str(e),
            'from_currency': from_currency,
            'to_currency': to_currency,
            'fallback_available': False
        }), 500

@exchange_api.route('/convert_amount', methods=['GET'])
def convert_currency_amount():
    """
    Convert an amount from one currency to another.
    
    Query parameters:
        amount: Amount to convert (required)
        from_currency: Source currency code (3-letter ISO, default: USD)
        to_currency: Target currency code (3-letter ISO, default: USD)
        refresh: Force refresh of cached data (optional, default: false)
    
    Returns:
        JSON with the converted amount
    """
    try:
        # Get parameters from request
        amount_str = request.args.get('amount')
        if not amount_str:
            return jsonify({'success': False, 'error': 'Amount is required'}), 400
            
        amount = float(amount_str)
        from_currency = request.args.get('from_currency', 'USD').upper()
        to_currency = request.args.get('to_currency', 'USD').upper()
        refresh = request.args.get('refresh', 'false').lower() == 'true'
        
        # Get API key from environment
        api_key = os.environ.get('EXCHANGERATE_API_KEY')
        
        # Convert the amount
        converted = convert_amount(
            amount=amount,
            from_currency=from_currency,
            to_currency=to_currency,
            api_key=api_key,
            force_refresh=refresh
        )
        
        # Return the results
        return jsonify({
            'success': True,
            'from_currency': from_currency,
            'to_currency': to_currency,
            'original_amount': amount,
            'converted_amount': converted,
            'timestamp': datetime.now().isoformat(),
            'source': 'logistics_app_exchange_api'
        })
    except ValueError as e:
        return jsonify({'success': False, 'error': f'Invalid input: {str(e)}'}), 400
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Command-line interface for testing
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 3:
        print("Usage: python exchange_api.py <from_currency> <to_currency> [amount]")
        sys.exit(1)
    
    from_currency = sys.argv[1].upper()
    to_currency = sys.argv[2].upper()
    amount = float(sys.argv[3]) if len(sys.argv) > 3 else 1.0
    
    try:
        # Get API key from environment
        api_key = os.environ.get('EXCHANGERATE_API_KEY')
        
        # Get the exchange rate
        rate = get_rate(from_currency, to_currency, api_key)
        
        # Calculate the converted amount
        converted = amount * rate
        
        # Print the results
        print(f"Exchange Rate: 1 {from_currency} = {rate:.6f} {to_currency}")
        print(f"Converted: {amount:.2f} {from_currency} = {converted:.2f} {to_currency}")
    except Exception as e:
        print(f"Error: {e}")
