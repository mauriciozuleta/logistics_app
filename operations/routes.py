from flask import Blueprint, render_template

operations = Blueprint("operations", __name__, template_folder="templates")

@operations.route('/dashboard')
def dashboard():
    return render_template('operations/operations_dashboard.html')