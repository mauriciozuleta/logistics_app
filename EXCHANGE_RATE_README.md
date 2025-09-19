# Exchange Rate Integration

This integration adds exchange rate functionality to the logistics app. The system retrieves current exchange rates for different currencies and populates the exchange rate field automatically when a country is selected.

## How It Works

1. When a country is selected, the system loads products for that country
2. The API response includes the country's currency code
3. The JavaScript then fetches the current exchange rate for that currency to USD
4. The exchange rate is automatically populated in the exchange_rate field

## Testing Instructions

1. Start the Flask development server:
   ```
   python run_dev_server.py
   ```

2. Open the application in your browser at:
   http://localhost:5000/

3. Navigate to the shipment management page and select a country

4. Verify that the exchange rate field is automatically populated

## Debugging

If the exchange rate is not automatically populated, you can use these debugging tools:

1. Test the exchange rate module directly:
   ```
   python test_exchange_rate.py
   ```
   
2. Check if the server is running correctly:
   ```
   python check_server.py
   ```

3. Look at the browser console for any JavaScript errors

## Fallback Mechanism

The system includes multiple fallback options if exchange rate APIs are unavailable:

1. First tries ExchangeRate-API (requires API key)
2. Then tries Open Exchange Rates (requires API key)
3. Then tries European Central Bank (no API key needed)
4. Finally uses static fallback values from data/static_exchange_rates.json

If all else fails, it uses hardcoded default values in the JavaScript.

## API Endpoints

- Get exchange rate: `/api/exchange/get_exchange_rate?from_currency=EUR&to_currency=USD`
- Convert amount: `/api/exchange/convert_amount?amount=100&from_currency=EUR&to_currency=USD`

## Environment Variables

For production use, set these environment variables:
- `EXCHANGERATE_API_KEY`: API key for ExchangeRate-API
- `OPEN_EXCHANGE_RATES_API_KEY`: API key for Open Exchange Rates