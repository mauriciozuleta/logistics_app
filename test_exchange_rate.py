"""
Test script for the exchange rate module.
This script tests the exchange rate functionality directly,
without going through the Flask API.
"""

import os
import sys
from data.exchange_rate import get_exchange_rate, convert_amount, clear_cache

def test_exchange_rate():
    """Test basic exchange rate functionality"""
    print("\n=== Exchange Rate Module Test ===")
    
    # Test currencies
    test_currencies = [
        ('USD', 'EUR'),
        ('EUR', 'USD'),
        ('GBP', 'USD'),
        ('USD', 'JPY'),
        ('CAD', 'USD'),
        ('AUD', 'EUR')
    ]
    
    # Get API key from environment
    api_key = os.environ.get('EXCHANGERATE_API_KEY')
    if not api_key:
        print("Warning: No API key found in environment. Using fallback methods.")
    
    # Test each currency pair
    for from_currency, to_currency in test_currencies:
        try:
            rate = get_exchange_rate(from_currency, to_currency, api_key)
            converted = convert_amount(100, from_currency, to_currency, api_key)
            
            print(f"Exchange rate: 1 {from_currency} = {rate:.6f} {to_currency}")
            print(f"Converted: 100 {from_currency} = {converted:.2f} {to_currency}")
            print(f"Status: SUCCESS")
            print("---")
        except Exception as e:
            print(f"Error converting {from_currency} to {to_currency}: {str(e)}")
            print(f"Status: FAILED")
            print("---")
    
    # Test with invalid currency
    try:
        invalid_rate = get_exchange_rate('USD', 'XYZ', api_key)
        print("Invalid currency test result:", invalid_rate)
    except Exception as e:
        print(f"Invalid currency test error (expected): {str(e)}")
    
    # Test cache
    print("\nTesting cache functionality...")
    
    # Get cached rate
    start_time = __import__('time').time()
    cached_rate = get_exchange_rate('USD', 'EUR', api_key)
    cached_time = __import__('time').time() - start_time
    
    print(f"Cached request time: {cached_time:.6f} seconds")
    
    # Clear cache and get fresh rate
    clear_cache()
    
    start_time = __import__('time').time()
    fresh_rate = get_exchange_rate('USD', 'EUR', api_key)
    fresh_time = __import__('time').time() - start_time
    
    print(f"Fresh request time: {fresh_time:.6f} seconds")
    print(f"Same result: {'Yes' if cached_rate == fresh_rate else 'No'}")
    
    # Success
    print("\nTest completed.")

if __name__ == "__main__":
    # If specific currencies are provided as arguments, test just those
    if len(sys.argv) >= 3:
        from_currency = sys.argv[1].upper()
        to_currency = sys.argv[2].upper()
        amount = float(sys.argv[3]) if len(sys.argv) > 3 else 100.0
        
        try:
            # Get API key from environment
            api_key = os.environ.get('EXCHANGERATE_API_KEY')
            
            # Get the exchange rate
            rate = get_exchange_rate(from_currency, to_currency, api_key)
            
            # Calculate the converted amount
            converted = amount * rate
            
            # Print the results
            print(f"Exchange Rate: 1 {from_currency} = {rate:.6f} {to_currency}")
            print(f"Converted: {amount:.2f} {from_currency} = {converted:.2f} {to_currency}")
        except Exception as e:
            print(f"Error: {e}")
    else:
        # Run the full test suite
        test_exchange_rate()