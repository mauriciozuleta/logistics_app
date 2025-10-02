import requests
import json
import os
import re
from datetime import datetime
from flask import Blueprint, jsonify, request, current_app
from models import Product, Country, CompetitivePrice
from extensions import db

market_analysis_bp = Blueprint('market_analysis_bp', __name__)

ANALYSIS_DATA_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data', 'market_analysis')

@market_analysis_bp.route('/test', methods=['GET'])
def test_route():
    """Simple test route to verify the blueprint is working"""
    return jsonify({"status": "ok", "message": "Market analysis blueprint is working!"})


@market_analysis_bp.route('/market-analysis/<country_code>/<int:product_id>', methods=['GET'])
def get_single_product_analysis(country_code, product_id):
    """
    Runs an AI-driven market analysis for a single product.
    """
    try:
        target_country = Country.query.get(country_code)
        product = Product.query.get(product_id)

        if not target_country or not product:
            return jsonify({"error": "Country or Product not found"}), 404

        local_products = Product.query.filter_by(country_id=country_code).all()
        local_product_names = [p.name for p in local_products]
        
        all_products = Product.query.all()


        prompt = f"""
        Analyze the market opportunity for the product '{product.name}' (from {product.country.country_name}) in {target_country.country_name}.

        Context:
        - Target Market: {target_country.country_name}
        - Product for Analysis: '{product.name}' (Type: {product.product_type})
        - Products already produced in {target_country.country_name}: {', '.join(local_product_names) if local_product_names else 'None listed'}
        - All other available products (potential imports): {[p.name for p in all_products if p.id != product.id]}

        Based on this context, evaluate the following:
        1.  Competition: Is there a similar product already produced locally?
        2.  Uniqueness: Does this product offer something unique compared to local and other imported products?
        3.  Potential Demand: Is there a likely demand for this type of product?

        Provide your response in a JSON object with two keys:
        - "status": one of 'good', 'restricted', or 'fail'.
        - "tooltip": a concise (2-3 sentences) explanation for your reasoning.

        Example response:
        {{
            "status": "good",
            "tooltip": "This product is unique and has no direct local competition, suggesting a strong market entry opportunity."
        }}
        """

        try:
            url = "https://api.openai.com/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {os.getenv('OPENAI_API_KEY')}",
                "Content-Type": "application/json"
            }
            data = {
                "model": "gpt-3.5-turbo",
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 150
            }
            response = requests.post(url, headers=headers, json=data)
            response.raise_for_status()
            content = response.json()["choices"][0]["message"]["content"]
            
            # Create directory if it doesn't exist
            if not os.path.exists(ANALYSIS_DATA_PATH):
                os.makedirs(ANALYSIS_DATA_PATH)

            # Sanitize product name for filename
            safe_product_name = re.sub(r'[\\/*?:"<>|]', "", product.name)
            
            # Create a unique filename
            timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
            filename = f"{country_code}_{safe_product_name}_{timestamp}.txt"
            filepath = os.path.join(ANALYSIS_DATA_PATH, filename)

            # Save the full AI response to the text file
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)

            ai_response_data = json.loads(content)
            
            # Save to competitive price table
            new_price_entry = CompetitivePrice(
                product_id=product.id,
                product_code=product.product_code,
                country=target_country.country_name,
                origin=product.country.country_name,
                price_to_compare=0,  # Placeholder, as we don't have a price from this analysis
                updated_date=datetime.utcnow().date(),
                source='AI',
                analysis_file_path=filepath  # Save the path to the analysis file
            )
            db.session.add(new_price_entry)
            db.session.commit()

            return jsonify({
                "status": ai_response_data.get("status", "fail"),
                "tooltip": ai_response_data.get("tooltip", "AI analysis failed or returned invalid format.")
            })

        except Exception as e:
            current_app.logger.error(f"Error during AI analysis: {e}")
            return jsonify({"error": "An error occurred during AI analysis.", "details": str(e)}), 500

    except Exception as e:
        current_app.logger.error(f"Fatal error in get_single_product_analysis: {e}")
        return jsonify({"error": "A fatal error occurred.", "details": str(e)}), 500


