"""
Exchange Rate Utility for Logistics App

This module provides functions to fetch and manage currency exchange rates
from various external APIs. It integrates with the logistics app to provide
up-to-date currency conversions for financial calculations.
"""

import os
import requests
import json
from datetime import datetime, timedelta
import logging
from typing import Dict, Optional, Tuple, Union, Any

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Constants
DEFAULT_BASE_CURRENCY = "USD"
CACHE_EXPIRY_HOURS = 12  # Cache exchange rates for 12 hours

# Cache for exchange rates to minimize API calls
_exchange_rate_cache = {}


def get_exchange_rate(
    from_currency: str, 
    to_currency: str, 
    api_key: Optional[str] = None,
    base_currency: str = DEFAULT_BASE_CURRENCY,
    force_refresh: bool = False
) -> float:
    """
    Get the exchange rate between two currencies.
    
    Args:
        from_currency: The source currency code (3-letter ISO code, e.g., "USD")
        to_currency: The target currency code (3-letter ISO code, e.g., "EUR")
        api_key: API key for the exchange rate service (optional)
        base_currency: Base currency for exchange rates if direct conversion isn't available
        force_refresh: Force refresh of exchange rate data even if cached
        
    Returns:
        The exchange rate as a float
    
    Raises:
        ValueError: If invalid currency codes are provided
        ConnectionError: If unable to connect to exchange rate API
    """
    # Standardize currency codes
    from_currency = from_currency.upper().strip()
    to_currency = to_currency.upper().strip()
    
    # If same currency, return 1.0
    if from_currency == to_currency:
        return 1.0
    
    # Check cache first (unless forced refresh)
    cache_key = f"{from_currency}_{to_currency}"
    
    if not force_refresh and cache_key in _exchange_rate_cache:
        cache_entry = _exchange_rate_cache[cache_key]
        cache_time = cache_entry['timestamp']
        
        # If cache is still valid (less than CACHE_EXPIRY_HOURS old)
        if datetime.now() - cache_time < timedelta(hours=CACHE_EXPIRY_HOURS):
            logger.debug(f"Using cached exchange rate for {cache_key}")
            return cache_entry['rate']
    
    # Try multiple APIs in order of preference
    rate = None
    error_messages = []
    
    # First try the Exchange Rate API
    try:
        rate = _get_rate_from_exchangerate_api(from_currency, to_currency, api_key)
    except Exception as e:
        error_messages.append(f"ExchangeRate API error: {str(e)}")
    
    # If that fails, try Open Exchange Rates
    if rate is None:
        try:
            rate = _get_rate_from_open_exchange_rates(from_currency, to_currency, api_key)
        except Exception as e:
            error_messages.append(f"Open Exchange Rates API error: {str(e)}")
    
    # If that fails, try European Central Bank
    if rate is None:
        try:
            rate = _get_rate_from_ecb(from_currency, to_currency)
        except Exception as e:
            error_messages.append(f"ECB API error: {str(e)}")
    
    # If rate is still None, we couldn't get data from any API
    if rate is None:
        raise ConnectionError(f"Failed to get exchange rate for {from_currency} to {to_currency}. Errors: {'; '.join(error_messages)}")
    
    # Cache the result
    _exchange_rate_cache[cache_key] = {
        'rate': rate,
        'timestamp': datetime.now()
    }
    
    return rate


def _get_rate_from_exchangerate_api(from_currency: str, to_currency: str, api_key: Optional[str] = None) -> Optional[float]:
    """
    Get exchange rate from the ExchangeRate-API.
    
    API details: https://www.exchangerate-api.com/
    Free tier available with limited requests.
    """
    # Try to get API key from environment if not provided
    if api_key is None:
        api_key = os.environ.get('EXCHANGERATE_API_KEY')
    
    # If still no API key, can't use this service
    if not api_key:
        logger.warning("No API key for ExchangeRate-API")
        return None
    
    url = f"https://v6.exchangerate-api.com/v6/{api_key}/pair/{from_currency}/{to_currency}"
    
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()  # Raise exception for HTTP errors
        
        data = response.json()
        
        if data.get('result') == 'success':
            return data.get('conversion_rate')
        else:
            logger.warning(f"ExchangeRate-API error: {data.get('error', 'Unknown error')}")
            return None
    
    except requests.exceptions.RequestException as e:
        logger.warning(f"ExchangeRate-API request failed: {str(e)}")
        return None


def _get_rate_from_open_exchange_rates(
    from_currency: str, 
    to_currency: str, 
    api_key: Optional[str] = None,
    base_currency: str = DEFAULT_BASE_CURRENCY
) -> Optional[float]:
    """
    Get exchange rate from Open Exchange Rates.
    
    API details: https://openexchangerates.org/
    Free tier available with limited requests.
    """
    # Try to get API key from environment if not provided
    if api_key is None:
        api_key = os.environ.get('OPEN_EXCHANGE_RATES_API_KEY')
    
    # If still no API key, can't use this service
    if not api_key:
        logger.warning("No API key for Open Exchange Rates")
        return None
    
    url = f"https://openexchangerates.org/api/latest.json?app_id={api_key}"
    
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        if 'rates' in data:
            # Open Exchange Rates uses USD as base currency in free tier
            # So convert to required rate using cross-rate calculation
            rates = data['rates']
            
            if from_currency == 'USD':
                # Direct USD to target conversion
                if to_currency in rates:
                    return rates[to_currency]
            elif to_currency == 'USD':
                # Direct source to USD conversion
                if from_currency in rates:
                    return 1.0 / rates[from_currency]
            else:
                # Cross-rate calculation
                if from_currency in rates and to_currency in rates:
                    return rates[to_currency] / rates[from_currency]
        
        logger.warning(f"Failed to get rate from Open Exchange Rates")
        return None
    
    except requests.exceptions.RequestException as e:
        logger.warning(f"Open Exchange Rates request failed: {str(e)}")
        return None


def _get_rate_from_ecb(from_currency: str, to_currency: str) -> Optional[float]:
    """
    Get exchange rate from European Central Bank.
    
    No API key needed, but only supports EUR-based conversions.
    """
    url = "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml"
    
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        
        import xml.etree.ElementTree as ET
        
        # Parse XML response
        root = ET.fromstring(response.content)
        ns = {'ecb': 'http://www.ecb.int/vocabulary/2002-08-01/eurofxref'}
        
        # Extract rates
        rates = {}
        rates['EUR'] = 1.0  # Base currency
        
        for cube in root.findall('.//ecb:Cube[@currency]', ns):
            currency = cube.attrib['currency']
            rate = float(cube.attrib['rate'])
            rates[currency] = rate
        
        # Calculate the exchange rate
        if from_currency == 'EUR' and to_currency in rates:
            return rates[to_currency]
        elif to_currency == 'EUR' and from_currency in rates:
            return 1.0 / rates[from_currency]
        elif from_currency in rates and to_currency in rates:
            # Cross-rate: from_currency to EUR to to_currency
            return rates[to_currency] / rates[from_currency]
        
        logger.warning(f"ECB does not provide rate for {from_currency} to {to_currency}")
        return None
    
    except Exception as e:
        logger.warning(f"ECB request failed: {str(e)}")
        return None


def clear_cache() -> None:
    """Clear the exchange rate cache."""
    global _exchange_rate_cache
    _exchange_rate_cache = {}
    logger.info("Exchange rate cache cleared")


def convert_amount(
    amount: float, 
    from_currency: str, 
    to_currency: str, 
    api_key: Optional[str] = None,
    force_refresh: bool = False
) -> float:
    """
    Convert an amount from one currency to another.
    
    Args:
        amount: The amount to convert
        from_currency: The source currency code
        to_currency: The target currency code
        api_key: API key for exchange rate service (optional)
        force_refresh: Force refresh of exchange rate data
        
    Returns:
        The converted amount as a float
    """
    rate = get_exchange_rate(from_currency, to_currency, api_key, force_refresh=force_refresh)
    return amount * rate


if __name__ == "__main__":
    # Simple CLI for testing
    import argparse
    
    parser = argparse.ArgumentParser(description='Get currency exchange rates')
    parser.add_argument('--from', dest='from_currency', required=True, help='Source currency code (3-letter ISO)')
    parser.add_argument('--to', dest='to_currency', required=True, help='Target currency code (3-letter ISO)')
    parser.add_argument('--amount', type=float, default=1.0, help='Amount to convert (default: 1.0)')
    parser.add_argument('--api-key', help='API key for exchange rate service')
    parser.add_argument('--refresh', action='store_true', help='Force refresh exchange rate data')
    
    args = parser.parse_args()
    
    try:
        rate = get_exchange_rate(
            args.from_currency, 
            args.to_currency, 
            api_key=args.api_key,
            force_refresh=args.refresh
        )
        
        converted = args.amount * rate
        
        print(f"Exchange Rate: 1 {args.from_currency} = {rate:.6f} {args.to_currency}")
        print(f"Converted Amount: {args.amount:.2f} {args.from_currency} = {converted:.2f} {args.to_currency}")
    
    except Exception as e:
        print(f"Error: {str(e)}")
