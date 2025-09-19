"""
Test the API endpoints directly without a running server.
This simulates requests to the exchange rate API endpoint.
"""

from flask import Flask, request
import json
import os
import sys

# Import our modules
from operations.exchange_api import exchange_api
from data.exchange_rate import get_exchange_rate, convert_amount

# Create a minimal test app
app = Flask(__name__)
app.register_blueprint(exchange_api, url_prefix='/api/exchange')

def test_exchange_rate_endpoint():
    """Test the exchange rate API endpoint directly"""
    from_currency = 'COP'
    to_currency = 'USD'
    
    # Create a test client
    with app.test_client() as client:
        # Make a request to the endpoint
        response = client.get(f'/api/exchange/get_exchange_rate?from_currency={from_currency}&to_currency={to_currency}')
        
        # Print the response
        print(f"Status code: {response.status_code}")
        
        data = json.loads(response.data)
        print("Response data:")
        for key, value in data.items():
            print(f"  {key}: {value}")
        
        if data.get('success'):
            print(f"\nExchange rate: 1 {from_currency} = {data['rate']} {to_currency}")

if __name__ == "__main__":
    # Allow custom testing
    if len(sys.argv) >= 3:
        from_currency = sys.argv[1].upper()
        to_currency = sys.argv[2].upper()
        
        # Test the direct module
        print(f"=== Direct Module Test: {from_currency} to {to_currency} ===")
        try:
            rate = get_exchange_rate(from_currency, to_currency)
            print(f"Exchange rate: 1 {from_currency} = {rate} {to_currency}")
        except Exception as e:
            print(f"Error: {str(e)}")
            
        # Test the endpoint
        print(f"\n=== API Endpoint Test: {from_currency} to {to_currency} ===")
        
        # Create a test client
        with app.test_client() as client:
            # Make a request to the endpoint
            response = client.get(f'/api/exchange/get_exchange_rate?from_currency={from_currency}&to_currency={to_currency}')
            
            # Print the response
            print(f"Status code: {response.status_code}")
            
            data = json.loads(response.data)
            print("Response data:")
            for key, value in data.items():
                print(f"  {key}: {value}")
    else:
        test_exchange_rate_endpoint()