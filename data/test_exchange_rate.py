"""
Test script for the exchange_rate module.

This script demonstrates how to use the exchange rate functionality
to convert between different currencies.

Usage:
    python test_exchange_rate.py

Note: Set your API key as an environment variable or pass it as an argument
"""

import os
import sys
from datetime import datetime

# Add the parent directory to sys.path to import the module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from data.exchange_rate import get_exchange_rate, convert_amount

def test_exchange_rates():
    """Test exchange rate conversions for various currencies."""
    print(f"Exchange Rate Test - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("-" * 50)
    
    # Define test currency pairs
    currency_pairs = [
        ("USD", "EUR"),
        ("EUR", "GBP"),
        ("USD", "JPY"),
        ("GBP", "CAD"),
        ("AUD", "NZD"),
    ]
    
    # Test amount to convert
    test_amount = 100
    
    # Get API key from environment variable (or you can hardcode for testing)
    api_key = os.environ.get('EXCHANGERATE_API_KEY')
    
    # If no API key, inform the user
    if not api_key:
        print("Warning: No API key found in environment variables.")
        print("Set EXCHANGERATE_API_KEY environment variable or pass it as an argument.")
        print("Will attempt to use API services that don't require a key.")
    
    # Test each currency pair
    for from_currency, to_currency in currency_pairs:
        try:
            # Get exchange rate
            rate = get_exchange_rate(from_currency, to_currency, api_key=api_key)
            
            # Convert a test amount
            converted = convert_amount(test_amount, from_currency, to_currency, api_key=api_key)
            
            print(f"{from_currency} → {to_currency}:")
            print(f"  Rate: 1 {from_currency} = {rate:.6f} {to_currency}")
            print(f"  {test_amount} {from_currency} = {converted:.2f} {to_currency}")
            print()
            
        except Exception as e:
            print(f"Error converting {from_currency} to {to_currency}: {str(e)}")
            print()

if __name__ == "__main__":
    test_exchange_rates()