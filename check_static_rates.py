"""
Test script for the static exchange rates file.
"""

import json
import os
import sys

def load_static_rates():
    """Load static exchange rates from JSON file"""
    current_dir = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(current_dir, 'data', 'static_exchange_rates.json')
    
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
        return data.get('rates', {}), file_path
    except Exception as e:
        print(f"Error loading static rates: {str(e)}")
        return {}, file_path

def get_static_rate(from_currency, to_currency, rates):
    """Calculate exchange rate from static rates"""
    from_currency = from_currency.upper()
    to_currency = to_currency.upper()
    
    if from_currency == to_currency:
        return 1.0
        
    if from_currency == 'USD' and to_currency in rates:
        return rates[to_currency]
    elif to_currency == 'USD' and from_currency in rates:
        return 1.0 / rates[from_currency]
    elif from_currency in rates and to_currency in rates:
        # Cross-rate calculation
        return rates[to_currency] / rates[from_currency]
    
    return None

def test_specific_rate(from_currency, to_currency, rates):
    """Test a specific currency pair"""
    rate = get_static_rate(from_currency, to_currency, rates)
    
    if rate is not None:
        print(f"✓ {from_currency} to {to_currency}: {rate:.6f}")
        return True
    else:
        print(f"✗ {from_currency} to {to_currency}: Not available")
        return False

def test_static_rates():
    """Test the static exchange rates file"""
    rates, file_path = load_static_rates()
    
    if not rates:
        print(f"Failed to load static rates from {file_path}")
        return
    
    print(f"Loaded {len(rates)} currencies from {file_path}")
    print(f"Available currencies: {', '.join(sorted(rates.keys()))}")
    
    # Test specific rates
    print("\nTesting common currency pairs:")
    test_pairs = [
        ('USD', 'EUR'),
        ('EUR', 'USD'),
        ('GBP', 'USD'),
        ('USD', 'JPY'),
        ('COP', 'USD'),  # Colombian Peso
        ('USD', 'COP'),  # USD to Colombian Peso
        ('BRL', 'USD'),  # Brazilian Real
        ('MXN', 'USD'),  # Mexican Peso
        ('EUR', 'GBP'),  # Cross rate
    ]
    
    success_count = 0
    for from_currency, to_currency in test_pairs:
        if test_specific_rate(from_currency, to_currency, rates):
            success_count += 1
    
    print(f"\nSuccessfully tested {success_count} of {len(test_pairs)} currency pairs")
    
    # Allow custom testing
    if len(sys.argv) >= 3:
        from_currency = sys.argv[1].upper()
        to_currency = sys.argv[2].upper()
        
        print(f"\nTesting custom pair: {from_currency} to {to_currency}")
        test_specific_rate(from_currency, to_currency, rates)

if __name__ == "__main__":
    test_static_rates()