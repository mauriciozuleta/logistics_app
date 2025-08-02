from flask import Flask, render_template
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

# Import models and blueprints
from extensions import db
from coredata.routes import coredata_bp
from financial.routes import financial
from users.routes import users
from ops.routes import ops
from operations.routes import operations, operations_api

app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = 'your-secret-key'  # Replace with a secure key
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///your_database.db'  # Adjust as needed
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Database & Migrate setup
db.init_app(app)
migrate = Migrate(app, db)

# Blueprint registration
app.register_blueprint(coredata_bp, url_prefix='/coredata')
app.register_blueprint(financial, url_prefix='/financial')
app.register_blueprint(users, url_prefix='/users')
app.register_blueprint(operations, url_prefix='/operations')
app.register_blueprint(operations_api, url_prefix='/api')
app.register_blueprint(ops, url_prefix='/ops')

# Homepage route
@app.route('/')
def home():
    return render_template('home.html')

if __name__ == '__main__':
    app.run(debug=True)