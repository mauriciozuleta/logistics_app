"""
Complete test suite for the AI price search function using different product types
"""

import sys
import os
import json
from flask import Flask, request

def run_test(product_name, country):
    """Run a test with the specified product and country"""
    print(f"\n=== Testing AI price search for '{product_name}' in {country} ===")
    
    # Create a Flask test context
    app = Flask(__name__)
    with app.test_request_context(f'/api/ai_price_search?product_name={product_name}&country={country}'):
        # Import the AI price search function
        from coredata.routes import ai_price_search
        
        # Call the function
        result = ai_price_search()
        
        # Parse and print the result
        result_data = json.loads(result.data.decode('utf-8'))
        print("\nResults:")
        print(f"  Success: {result_data.get('success')}")
        print(f"  Primary Price: ${result_data.get('primary')}")
        print(f"  Accuracy: {result_data.get('accuracy')}%")
        print(f"  Alternative Suggestions: {result_data.get('suggestions')}")
        
        return result_data

def test_all_combinations():
    """Test a variety of product/country combinations"""
    
    # Common product types
    products = [
        # Foods
        "coffee", "rice", "sugar", "olive oil", "tomatoes", 
        # Electronics
        "laptop", "smartphone", "television", 
        # Household
        "sofa", "mattress", "refrigerator",
        # Clothing
        "jeans", "t-shirt", "running shoes",
        # Random items
        "bicycle", "guitar", "toy car"
    ]
    
    # Countries representing different regions
    countries = [
        "USA", "Canada", "Mexico",  # North America
        "UK", "Germany", "France",  # Europe
        "Japan", "China", "India",  # Asia
        "Australia", "Brazil", "South Africa"  # Others
    ]
    
    # Test a subset of combinations (to avoid excessive testing)
    test_count = 0
    results = {}
    
    for product in products[:5]:  # Limit to first 5 products
        for country in countries[:3]:  # Limit to first 3 countries
            print(f"\nTest #{test_count + 1}:")
            result = run_test(product, country)
            results[f"{product}-{country}"] = result
            test_count += 1
    
    # Print summary
    print("\n=== Test Summary ===")
    print(f"Ran {test_count} tests")
    success_count = sum(1 for r in results.values() if r.get('success') and r.get('primary') is not None)
    print(f"Success rate: {success_count}/{test_count} ({success_count/test_count*100:.1f}%)")
    
    avg_accuracy = sum(r.get('accuracy', 0) for r in results.values() if r.get('primary') is not None) / success_count if success_count else 0
    print(f"Average accuracy: {avg_accuracy:.1f}%")
    
    return results

if __name__ == "__main__":
    print("Starting AI price search test suite...")
    test_all_combinations()