"""
Run the Flask development server with debugging enabled.
"""

import os
from app import app

if __name__ == '__main__':
    # Set debug mode
    os.environ['FLASK_DEBUG'] = '1'
    
    # Print startup message
    print("=== Starting Flask Development Server ===")
    print("URL: http://localhost:5000/")
    print("Debug mode: ON")
    print("Press CTRL+C to stop the server")
    print("=====================================")
    
    # Run the server
    app.run(debug=True)