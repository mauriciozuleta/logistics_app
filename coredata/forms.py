from wtforms import StringField, FloatField, SelectField, SubmitField
from wtforms.validators import DataRequired, Optional
from flask_wtf import FlaskForm
from wtforms import FormField

class TraderForm(FlaskForm):
    country_id = SelectField('Country', coerce=str, validators=[DataRequired()])
    name = StringField('Name', validators=[DataRequired()])

    # Export Information
    export_year_operating_costs = FloatField('Year Operating Costs (Export)', validators=[Optional()])
    export_operating_expenses_pct = FloatField('% for Operating Expenses (Export)', validators=[Optional()])
    export_profit_pct = FloatField('% Profit (Export)', validators=[Optional()])
    export_sales_tax = FloatField('Sales Tax (Export)', validators=[Optional()])
    export_other_taxes = FloatField('Other Taxes (Export)', validators=[Optional()])

    # Import Information
    import_year_operating_costs = FloatField('Year Operating Costs (Import)', validators=[Optional()])
    import_operating_expenses_pct = FloatField('% for Operating Expenses (Import)', validators=[Optional()])
    import_profit_pct = FloatField('% Profit (Import)', validators=[Optional()])
    import_import_taxes = FloatField('Import Taxes (Import)', validators=[Optional()])
    import_sales_tax = FloatField('Sales Tax (Import)', validators=[Optional()])
    import_other_taxes = FloatField('Other Taxes (Import)', validators=[Optional()])

    submit = SubmitField('Add Trader')

from flask_wtf import FlaskForm
from wtforms import StringField, FloatField, IntegerField, SubmitField, SelectField
from wtforms.validators import DataRequired, Optional

class AirportForm(FlaskForm):
    name = StringField('Airport Name', validators=[DataRequired()])
    iata_code = StringField('IATA Code', validators=[DataRequired()])
    city = StringField('City', validators=[DataRequired()])
    country_id = SelectField('Country', coerce=str, validators=[DataRequired()])
    fuel_cost_gl = FloatField('Fuel Cost (per gal)', validators=[Optional()])
    cargo_handling_cost_kg = FloatField('Cargo Handling Cost (per kg)', validators=[Optional()])
    airport_fee = FloatField('Airport Fee', validators=[Optional()])
    turnaround_cost = FloatField('Turnaround Cost', validators=[Optional()])
    other_desc = StringField('Other Description', validators=[Optional()])
    other_cost = FloatField('Other Cost', validators=[Optional()])
    submit = SubmitField('Add Airport')


class AircraftForm(FlaskForm):
    id = StringField('ID', validators=[DataRequired()])
    manufacturer = StringField('Manufacturer', validators=[Optional()])
    model = StringField('Model', validators=[Optional()])
    short_name = StringField('Short Name', validators=[Optional()])
    mtow_kg = FloatField('MTOW (kg)', validators=[Optional()])
    mtow_lbs = FloatField('MTOW (lbs)', validators=[Optional()])
    mldgw_kg = FloatField('MLDGW (kg)', validators=[Optional()])
    mldgw_lbs = FloatField('MLDGW (lbs)', validators=[Optional()])
    zero_fuel_kg = FloatField('Zero Fuel (kg)', validators=[Optional()])
    zero_fuel_lbs = FloatField('Zero Fuel (lbs)', validators=[Optional()])
    max_ramp_kg = FloatField('Max Ramp (kg)', validators=[Optional()])
    max_ramp_lbs = FloatField('Max Ramp (lbs)', validators=[Optional()])
    empty_weight_kg = FloatField('Empty Weight (kg)', validators=[Optional()])
    empty_weight_lbs = FloatField('Empty Weight (lbs)', validators=[Optional()])
    max_payload_kg = FloatField('Max Payload (kg)', validators=[Optional()])
    max_payload_lbs = FloatField('Max Payload (lbs)', validators=[Optional()])
    fuel_capacity_gal = FloatField('Fuel Capacity (gal)', validators=[Optional()])
    fuel_capacity_lbs = FloatField('Fuel Capacity (lbs)', validators=[Optional()])
    fuel_burn_gal = FloatField('Fuel Burn (gal)', validators=[Optional()])
    fuel_burn_lbs = FloatField('Fuel Burn (lbs)', validators=[Optional()])
    min_fuel_landed_gal = FloatField('Min Fuel Landed (gal)', validators=[Optional()])
    min_fuel_landed_lbs = FloatField('Min Fuel Landed (lbs)', validators=[Optional()])
    min_fuel_alternate_gal = FloatField('Min Fuel Alternate (gal)', validators=[Optional()])
    min_fuel_alternate_lbs = FloatField('Min Fuel Alternate (lbs)', validators=[Optional()])
    cargo_positions_main_deck = IntegerField('Cargo Positions Main Deck', validators=[Optional()])
    cargo_positions_lower_deck = IntegerField('Cargo Positions Lower Deck', validators=[Optional()])
    acmi_cost = FloatField('ACMI Cost', validators=[Optional()])
    submit = SubmitField('Add Aircraft')
