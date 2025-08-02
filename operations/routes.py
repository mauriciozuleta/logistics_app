
from flask import Blueprint, render_template
from models import Airport, Aircraft

operations = Blueprint("operations", __name__, template_folder="templates")


@operations.route('/dashboard')
def dashboard():
    return render_template('operations/operations_dashboard.html')

@operations.route('/add-route', methods=['GET', 'POST'])
def add_route():
    airports = Airport.query.order_by(Airport.city, Airport.iata_code).all()
    airport_choices = [(a.id, f"{a.city} / {a.iata_code}") for a in airports]
    aircrafts = Aircraft.query.order_by(Aircraft.short_name).all()
    aircraft_choices = [(a.id, a.short_name) for a in aircrafts]
    return render_template('operations/add_route.html', airport_choices=airport_choices, aircraft_choices=aircraft_choices)