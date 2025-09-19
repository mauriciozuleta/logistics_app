"""
Test script for the exchange rate search feature.
Tests if the exchange search page loads correctly.
"""

import requests
import sys

def test_exchange_search_page():
    """Test if the exchange search page loads correctly"""
    base_url = 'http://localhost:5000'
    url = f'{base_url}/operations/exchange_search'
    
    # Set query parameters for COP to USD
    params = {
        'from_currency': 'COP',
        'to_currency': 'USD'
    }
    
    try:
        # Make the request
        response = requests.get(url, params=params)
        
        # Check the status code
        print(f"Status code: {response.status_code}")
        
        if response.status_code == 200:
            # Page loaded successfully
            print("Exchange search page loaded successfully")
            print(f"URL: {response.url}")
            
            # Check if key elements are in the response
            if "Exchange Rate Search" in response.text:
                print("✓ Found page title")
            else:
                print("✗ Page title not found")
                
            if "Search for Current Rate" in response.text:
                print("✓ Found search button")
            else:
                print("✗ Search button not found")
                
            if "Manual Entry" in response.text:
                print("✓ Found manual entry section")
            else:
                print("✗ Manual entry section not found")
                
            # Return success
            return True
        else:
            # Page failed to load
            print(f"Exchange search page failed to load: {response.status_code}")
            print(f"Response: {response.text}")
            
            # Return failure
            return False
    except Exception as e:
        # Request failed
        print(f"Error making request: {str(e)}")
        
        # Return failure
        return False

if __name__ == "__main__":
    # Allow custom currencies
    if len(sys.argv) >= 3:
        from_currency = sys.argv[1].upper()
        to_currency = sys.argv[2].upper()
        
        # Test with custom currencies
        print(f"Testing exchange search for {from_currency} to {to_currency}")
        test_exchange_search_page()
    else:
        # Run the default test
        test_exchange_search_page()