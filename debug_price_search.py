"""
Test script for AI price search functionality without requiring Flask
"""

import re
import requests
import time
from bs4 import BeautifulSoup

# Try to import optional dependencies
try:
    from googlesearch import search
except ImportError:
    print("googlesearch-python not available, using fallback search")
    search = None

def test_price_search(product_name="coffee", country="USA"):
    """
    Direct implementation of price search logic for testing
    """
    print(f"\n=== TESTING AI PRICE SEARCH: '{product_name}' in {country} ===")
    
    try:
        # --- Price extraction patterns and config ---
        price_pattern = re.compile(r'\$\s?(\d{1,3}(?:,\d{3})*\.\d{2})')
        positive_keywords = ['price', 'sale', 'buy', 'cost', 'offer', 'walmart', 'amazon', 'target', 'costco']
        found_prices_with_context = []

        # Clean the product name
        clean_product_name = re.sub(r'[^a-zA-Z0-9\s]', '', product_name)
        
        # Create search query
        search_query = f'price of {clean_product_name} in {country} USD'
        print(f"Searching with query: '{search_query}'")
        
        # Initialize with fallback URLs
        search_results = [
            f"https://www.google.com/search?q=price+of+{clean_product_name}+in+{country}+USD",
            f"https://www.amazon.com/s?k={clean_product_name}"
        ]
        
        # Try to use the googlesearch library if available
        if search is not None:
            try:
                results = list(search(search_query, num_results=3, lang="en"))
                if results:
                    search_results = results
                print(f"Found {len(search_results)} search results: {search_results}")
            except Exception as search_error:
                print(f"Error during search: {search_error}")
        
        # Process each URL
        for url in search_results:
            try:
                print(f"\nFetching URL: {url}")
                response = requests.get(url, timeout=10, 
                                        headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'})
                
                if not response.ok:
                    print(f"Failed to fetch {url}: {response.status_code}")
                    continue
                
                print(f"Successfully fetched {url}")
                
                # Parse HTML with BeautifulSoup
                soup = BeautifulSoup(response.content, 'html.parser')
                page_text = soup.get_text().lower()
                
                print(f"Parsed page text (first 100 chars): {page_text[:100]}...")
                
                # Find all prices on the page
                matches = price_pattern.finditer(page_text)
                match_count = 0
                
                for match in matches:
                    try:
                        match_count += 1
                        price_str = match.group(1).replace(',', '')
                        price_val = float(price_str)
                        confidence = 0.5
                        
                        context_start = max(0, match.start() - 30)
                        context_end = min(len(page_text), match.end() + 30)
                        context_snippet = page_text[context_start:context_end]
                        
                        print(f"Found price: ${price_val} with context: '{context_snippet}'")

                        for keyword in positive_keywords:
                            if keyword in context_snippet:
                                confidence += 0.1
                                print(f"Found keyword '{keyword}' near price, increasing confidence")

                        found_prices_with_context.append({'price': price_val, 'confidence': min(1.0, confidence)})
                    except (ValueError, IndexError) as error:
                        print(f"Error processing match: {error}")
                        continue
                
                print(f"Found {match_count} price matches on this page")
                    
            except Exception as e:
                print(f"Could not process URL {url}: {e}")
                continue
        
        if found_prices_with_context:
            # Find the price with the highest confidence
            best_guess = max(found_prices_with_context, key=lambda x: x['confidence'])
            print(f"\nBest price: ${best_guess['price']} with confidence: {best_guess['confidence']}")
            
            # Get other unique prices as secondary suggestions
            all_prices = sorted(list(set([p['price'] for p in found_prices_with_context])))
            secondary_suggestions = [p for p in all_prices if p != best_guess['price']]
            
            print(f"Results:")
            print(f"  Primary: ${best_guess['price']}")
            print(f"  Accuracy: {int(best_guess['confidence']*100)}%")
            print(f"  Alternative suggestions: {secondary_suggestions}")
            
            return {
                'success': True,
                'primary': best_guess['price'],
                'accuracy': int(best_guess['confidence'] * 100),
                'suggestions': secondary_suggestions
            }
        else:
            print("No prices found.")
            return {'success': True, 'suggestions': [], 'primary': None, 'accuracy': 0}
            
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Test Error: {e}")
        print(f"Detailed traceback: {error_details}")
        return {'success': False, 'error': str(e)}

if __name__ == "__main__":
    # Test with various products
    test_price_search("coffee", "USA")
    test_price_search("laptop", "Canada")
    test_price_search("rice", "India")