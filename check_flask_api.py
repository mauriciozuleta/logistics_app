"""
Test script to check if the Flask API routes for exchange rates work correctly.
"""

from app import app
import requests

def test_flask_api():
    """Test the Flask API routes for exchange rates."""
    print("Testing Flask API routes...")
    
    with app.app_context():
        # Get the URL for the exchange rate API
        url = "http://localhost:5000/api/exchange/get_exchange_rate"
        
        try:
            # Test EUR to USD
            response = requests.get(f"{url}?from_currency=EUR&to_currency=USD")
            if response.status_code == 200:
                data = response.json()
                print(f"EUR to USD rate from API: {data.get('rate')}")
                print(f"API response: {data}")
            else:
                print(f"API request failed with status code: {response.status_code}")
                print(f"Response text: {response.text}")
            
            print("Flask API test completed!")
        except Exception as e:
            print(f"Error testing Flask API: {str(e)}")

if __name__ == "__main__":
    # Check if the Flask app is running
    try:
        response = requests.get("http://localhost:5000/")
        if response.status_code == 200:
            print("Flask app is running!")
            test_flask_api()
        else:
            print(f"Flask app is not responding correctly. Status code: {response.status_code}")
    except requests.exceptions.ConnectionError:
        print("Flask app is not running. Please start it with 'flask run' before running this test.")