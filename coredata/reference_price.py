import requests
from bs4 import BeautifulSoup

def get_reference_price(product, country):
    query = f"Average price of {product} in {country}"
    url = f"https://www.google.com/search?q={query.replace(' ', '+')}"
    headers = {
        "User-Agent": "Mozilla/5.0"
    }
    response = requests.get(url, headers=headers)
    soup = BeautifulSoup(response.text, "html.parser")

    import re
    # Search for price patterns in the entire page text
    page_text = soup.get_text()
    # Regex for prices like $1.99, USD 2.50, COP 5000
    price_patterns = [
        r'\$\s?\d+[\.,]?\d*',
        r'USD\s?\d+[\.,]?\d*',
        r'COP\s?\d+[\.,]?\d*',
        r'\d+[\.,]?\d*\s?USD',
        r'\d+[\.,]?\d*\s?COP'
    ]
    for pattern in price_patterns:
        match = re.search(pattern, page_text)
        if match:
            print(f"Found price pattern: {match.group()}")
            return match.group()
    print("No price found in search results.")
    return None

if __name__ == "__main__":
    product = input("Enter product name: ")
    country = input("Enter country: ")
    price = get_reference_price(product, country)
    print(f"Reference price for {product} in {country}: {price}")