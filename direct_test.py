"""
Integrated test for AI price search directly calling the function
"""
import sys
import os
import re
import json
from flask import Flask, request
from bs4 import BeautifulSoup

# Add the parent directory to sys.path to import app modules
parent_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, parent_dir)

# Create a minimal Flask application for testing
app = Flask(__name__)

# Set up a request context
with app.test_request_context('/api/ai_price_search?product_name=coffee&country=USA'):
    # Import the AI price search function now that we have a Flask context
    from coredata.routes import ai_price_search
    
    # Call the function directly
    print("Testing AI price search directly...")
    result = ai_price_search()
    
    # Print the result
    print("\nResults:")
    print(result.data.decode('utf-8'))

# Also test with different products
with app.test_request_context('/api/ai_price_search?product_name=laptop&country=Canada'):
    from coredata.routes import ai_price_search
    print("\nTesting with laptop in Canada...")
    result = ai_price_search()
    print("\nResults:")
    print(result.data.decode('utf-8'))