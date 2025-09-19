"""
Test script to check if the exchange rate API works correctly.
"""

from data.exchange_rate import get_exchange_rate, convert_amount

def test_exchange_rate():
    """Test the exchange rate API directly."""
    print("Testing exchange rate API directly...")
    
    try:
        # Test EUR to USD
        rate = get_exchange_rate("EUR", "USD")
        print(f"EUR to USD rate: {rate}")
        
        # Test USD to EUR
        rate = get_exchange_rate("USD", "EUR")
        print(f"USD to EUR rate: {rate}")
        
        # Test conversion
        amount = 100
        converted = convert_amount(amount, "EUR", "USD")
        print(f"{amount} EUR = {converted} USD")
        
        print("Direct API test successful!")
    except Exception as e:
        print(f"Error testing direct API: {str(e)}")

if __name__ == "__main__":
    test_exchange_rate()