import os
from flask import Flask, render_template
from flask_migrate import Migrate
from flask_wtf.csrf import CSRFProtect

def create_app():
    app = Flask(__name__)

    # Configuration
    # Use an environment variable for the secret key for better security
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'a-default-fallback-key-for-development')
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///your_database.db'
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

    app.register_blueprint(coredata_bp, url_prefix='/coredata')
    app.register_blueprint(financial, url_prefix='/financial')
    app.register_blueprint(users, url_prefix='/users')
    app.register_blueprint(operations, url_prefix='/operations')
    app.register_blueprint(operations_api, url_prefix='/api')
    app.register_blueprint(ops, url_prefix='/ops')

    # Exempt API routes from CSRF protection
    csrf.exempt(operations_api)

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