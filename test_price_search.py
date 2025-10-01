import requests

def test_ai_price_search():
    print("Testing AI Price Search functionality...")
    response = requests.get("http://127.0.0.1:5000/api/ai_price_search?product_name=coffee&country=USA")
    print(f"Response Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print("Response Data:")
        print(f"Success: {data.get('success')}")
        print(f"Primary Price: ${data.get('primary')}")
        print(f"Accuracy: {data.get('accuracy')}%")
        print(f"Alternative Suggestions: {data.get('suggestions')}")
    else:
        print(f"Error: {response.text}")

if __name__ == "__main__":
    test_ai_price_search()