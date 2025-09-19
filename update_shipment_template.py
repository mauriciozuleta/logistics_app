"""
This script helps update the shipment_management.html template
to include our new exchange rate button CSS file.
"""

import os
import re

def update_shipment_template():
    """
    Update the shipment_management.html template to include
    the exchange rate button CSS file.
    """
    # Path to the template file
    template_path = os.path.join('operations', 'templates', 'operations', 'shipment_management.html')
    full_path = os.path.abspath(template_path)
    
    if not os.path.exists(full_path):
        print(f"Template file not found: {full_path}")
        return False
        
    print(f"Updating template: {full_path}")
    
    # Read the template
    with open(full_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if CSS is already included
    if 'exchange_rate_button.css' in content:
        print("CSS already included, no update needed")
        return True
    
    # Find the styles block
    styles_pattern = r'{% block additional_styles %}(.*?){% endblock %}'
    styles_match = re.search(styles_pattern, content, re.DOTALL)
    
    if not styles_match:
        print("Could not find styles block in template")
        return False
    
    # Existing styles content
    styles_content = styles_match.group(1)
    
    # New styles content with our CSS
    new_styles = styles_content + """
<link rel="stylesheet" href="{{ url_for('static', filename='css/exchange_rate_button.css') }}">
"""
    
    # Replace the styles block
    updated_content = content.replace(
        styles_match.group(0),
        f"{{% block additional_styles %}}{new_styles}{{% endblock %}}"
    )
    
    # Write the updated template
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(updated_content)
    
    print("Successfully updated template with exchange rate button CSS")
    return True

if __name__ == "__main__":
    update_shipment_template()