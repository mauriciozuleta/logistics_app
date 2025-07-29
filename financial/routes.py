# Example for coredata/routes.py
from flask import Blueprint, render_template

financial = Blueprint("financial", __name__, template_folder="templates")

@financial.route('/dashboard')
def dashboard():
    return render_template('financial/financial_dashboard.html')