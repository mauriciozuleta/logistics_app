import requests
import sys

def check_server_status():
    """Check if the Flask server is running and accessible"""
    try:
        # Try to access a simple endpoint
        response = requests.get('http://localhost:5000/')
        if response.status_code == 200:
            print("✓ Server is running")
            return True
        else:
            print(f"✗ Server returned status code {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("✗ Cannot connect to server at http://localhost:5000/")
        print("  Make sure the Flask server is running.")
        return False

def test_exchange_api():
    """Test the exchange rate API endpoint"""
    if not check_server_status():
        return False
    
    # Test exchange rate API
    url = 'http://localhost:5000/api/exchange/get_exchange_rate'
    params = {
        'from_currency': 'EUR',
        'to_currency': 'USD'
    }
    
    try:
        print(f"\nTesting exchange rate API: {url}")
        print(f"Parameters: {params}")
        
        response = requests.get(url, params=params)
        print(f"Status code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("Response data:")
            for key, value in data.items():
                print(f"  {key}: {value}")
            return True
        else:
            print(f"Error response: {response.text}")
            return False
    except Exception as e:
        print(f"Error: {str(e)}")
        return False

def test_products_api(country_id='USA'):
    """Test the products by country API endpoint"""
    if not check_server_status():
        return False
    
    # Test products API
    url = f'http://localhost:5000/api/products-by-country?country_id={country_id}'
    
    try:
        print(f"\nTesting products API: {url}")
        
        response = requests.get(url)
        print(f"Status code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("Response data:")
            print(f"  country_id: {data.get('country_id')}")
            print(f"  country_currency: {data.get('country_currency')}")
            print(f"  products count: {len(data.get('products', []))}")
            
            # Print first product if available
            products = data.get('products', [])
            if products:
                print("\nFirst product:")
                for key, value in products[0].items():
                    print(f"  {key}: {value}")
            
            return True
        else:
            print(f"Error response: {response.text}")
            return False
    except Exception as e:
        print(f"Error: {str(e)}")
        return False

if __name__ == "__main__":
    country_id = sys.argv[1] if len(sys.argv) > 1 else 'USA'
    
    print("=== Flask Server Status Check ===")
    server_status = check_server_status()
    
    if server_status:
        test_exchange_api()
        test_products_api(country_id)
    
    print("\nCheck completed.")