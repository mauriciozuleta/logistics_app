import os
from dotenv import load_dotenv

# Load environment variables from .env file automatically
load_dotenv()
from flask import Flask, render_template
from flask_migrate import Migrate
from flask_wtf.csrf import CSRFProtect

def create_app():
    app = Flask(__name__)

    # Configuration
    # Use an environment variable for the secret key for better security
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'a-default-fallback-key-for-development')
    db_path = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'instance', 'your_database.db')
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Initialize extensions
    from extensions import db
    db.init_app(app)
    
    migrate = Migrate(app, db, render_as_batch=True)
    csrf = CSRFProtect(app)

    # Import models
    import models

    # Import and register blueprints
    from coredata.routes import coredata_bp
    from financial.routes import financial
    from users.routes import users
    from ops.routes import ops
    from operations.routes import operations, operations_api
    from operations.exchange_api import exchange_api
    from operations.api import operations_api_new
    from operations.airport_api import airport_api
    from operations.diagnostic_routes import operations_diagnostic

    # Register blueprints in proper order
    app.register_blueprint(coredata_bp, url_prefix='/coredata')
    csrf.exempt(coredata_bp)
    app.register_blueprint(financial, url_prefix='/financial')
    app.register_blueprint(users, url_prefix='/users')
    app.register_blueprint(ops, url_prefix='/ops')
    app.register_blueprint(operations, url_prefix='/operations')
    
    # Register both API blueprints under /api
    app.register_blueprint(operations_api_new, url_prefix='/api')
    app.register_blueprint(operations_api, url_prefix='/api')
    app.register_blueprint(airport_api, url_prefix='/api')
    csrf.exempt(operations_api_new)
    csrf.exempt(operations_api)
    csrf.exempt(airport_api)
    app.register_blueprint(exchange_api, url_prefix='/api/exchange')
    csrf.exempt(exchange_api)  # Exempt exchange_api from CSRF protection
    app.register_blueprint(operations_diagnostic, url_prefix='/diagnostic')

    # Homepage route
    @app.route('/')
    def home():
        return render_template('home.html')

    return app

# Create app instance
app = create_app()

if __name__ == '__main__':
    # The debug flag is now controlled by the FLASK_DEBUG environment variable
    app.run()