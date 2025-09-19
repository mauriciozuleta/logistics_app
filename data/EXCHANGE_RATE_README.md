# Exchange Rate API Documentation

This documentation explains how to use the exchange rate functionality in the Logistics App.

## Overview

The exchange rate system provides real-time currency conversion between different international currencies. It supports multiple API providers and includes caching to minimize API calls.

## Features

- Convert between any two currencies
- Cache exchange rates to minimize API calls
- Fall back to multiple API providers for reliability
- Support for both direct conversions and cross-rate calculations
- Web interface for currency conversion

## API Endpoints

### Get Exchange Rate

**Endpoint**: `/api/exchange/get_exchange_rate`

**Method**: GET

**Parameters**:
- `from_currency`: Source currency code (3-letter ISO, default: USD)
- `to_currency`: Target currency code (3-letter ISO, default: USD)
- `amount`: Amount to convert (optional, default: 1.0)
- `refresh`: Force refresh of cached data (optional, default: false)

**Response**:
```json
{
  "success": true,
  "from_currency": "USD",
  "to_currency": "EUR",
  "rate": 0.85,
  "amount": 100,
  "converted_amount": 85,
  "timestamp": "2025-09-19T12:34:56.789Z",
  "source": "logistics_app_exchange_api"
}
```

### Convert Amount

**Endpoint**: `/api/exchange/convert_amount`

**Method**: GET

**Parameters**:
- `amount`: Amount to convert (required)
- `from_currency`: Source currency code (3-letter ISO, default: USD)
- `to_currency`: Target currency code (3-letter ISO, default: USD)
- `refresh`: Force refresh of cached data (optional, default: false)

**Response**:
```json
{
  "success": true,
  "from_currency": "USD",
  "to_currency": "EUR",
  "original_amount": 100,
  "converted_amount": 85,
  "timestamp": "2025-09-19T12:34:56.789Z",
  "source": "logistics_app_exchange_api"
}
```

## Web Interface

A web interface for currency conversion is available at:

**URL**: `/operations/exchange-calculator`

This page provides an easy-to-use interface for converting between currencies and viewing exchange rates.

## Command Line Usage

You can use the exchange rate functionality from the command line for testing or scripting:

```bash
# Get exchange rate
python data/exchange_rate.py --from USD --to EUR

# Convert a specific amount
python data/exchange_rate.py --from USD --to EUR --amount 100

# Force refresh of exchange rate data
python data/exchange_rate.py --from USD --to EUR --refresh
```

## API Configuration

The exchange rate system supports multiple API providers:

1. [ExchangeRate-API](https://www.exchangerate-api.com/) (requires API key)
2. [Open Exchange Rates](https://openexchangerates.org/) (requires API key)
3. European Central Bank (no API key required, but limited to EUR-based conversions)

### Setting API Keys

Set API keys as environment variables:

```bash
# For ExchangeRate-API
set EXCHANGERATE_API_KEY=your_api_key

# For Open Exchange Rates
set OPEN_EXCHANGE_RATES_API_KEY=your_api_key
```

## Integration with Other Systems

To use the exchange rate functionality in your code:

```python
from data.exchange_rate import get_exchange_rate, convert_amount

# Get exchange rate
rate = get_exchange_rate("USD", "EUR")

# Convert amount
converted = convert_amount(100, "USD", "EUR")
```