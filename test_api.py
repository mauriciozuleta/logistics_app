"""
Test client for the AI price search API
"""

import requests
import json
import time

def test_api_call(product_name, country):
    """Test the AI price search API"""
    print(f"Testing AI price search for '{product_name}' in {country}")
    
    url = f"http://127.0.0.1:5000/api/ai_price_search?product_name={product_name}&country={country}"
    print(f"Calling API: {url}")
    
    try:
        response = requests.get(url, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            print("API Response:")
            print(json.dumps(data, indent=2))
            return data
        else:
            print(f"Error: Status code {response.status_code}")
            print(response.text)
            return None
    except Exception as e:
        print(f"Error calling API: {e}")
        return None

if __name__ == "__main__":
    # Test with various products
    test_api_call("coffee", "USA")
    time.sleep(2)  # Avoid overloading the server
    
    test_api_call("laptop", "Canada")
    time.sleep(2)
    
    test_api_call("rice", "India")