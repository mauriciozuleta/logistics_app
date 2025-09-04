from wtforms import StringField, FloatField, SelectField, SubmitField, TextAreaField
from wtforms.validators import DataRequired, Optional, Length
from flask_wtf import FlaskForm
from wtforms import FormField

# Removed TraderForm class as per the request

class RegionalManagerForm(FlaskForm):
    name = StringField('Manager Name', validators=[DataRequired(), Length(min=3, max=128)])
    region = SelectField('Region', validators=[DataRequired()])
    submit = SubmitField('Save Regional Manager')

# CountryTradeInfoForm for country-level trade info
class CountryTradeInfoForm(FlaskForm):
    country_id = SelectField('Country', coerce=str, validators=[DataRequired()])
    region_id = SelectField('Region', coerce=int, validators=[DataRequired()])
    operational_cost_year = FloatField('Operational Cost/Year (USD)', validators=[Optional()])
    revenue_taxes = FloatField('Revenue Taxes (%)', validators=[Optional()])
    export_profit_pct = FloatField('Export Profit (%)', validators=[Optional()])
    export_sales_tax = FloatField('Sales Tax (%)', validators=[Optional()])
    export_other_taxes = FloatField('Other Taxes (%)', validators=[Optional()])
    export_other_cost = FloatField('Other Cost (USD)', validators=[Optional()])
    import_profit_pct = FloatField('Import Profit (%)', validators=[Optional()])
    import_taxes = FloatField('Import Taxes (%)', validators=[Optional()])
    import_other_taxes = FloatField('Other Taxes (%)', validators=[Optional()])
    import_other_cost = FloatField('Other Cost (USD)', validators=[Optional()])
    other_taxes = FloatField('Other Taxes', validators=[Optional()])
    other_costs = FloatField('Other Costs (USD)', validators=[Optional()])
    additional_info = TextAreaField('Additional Information', validators=[Optional(), Length(max=500)])
    submit = SubmitField('Save Country Trade Info')

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
    altitude_ft = FloatField('Airport Altitude (ft)', validators=[Optional()])
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
    cruise_speed = FloatField('Cruise Speed', validators=[Optional()])
    acmi_cost = FloatField('ACMI Cost', validators=[Optional()])
    submit = SubmitField('Add Aircraft')


class ProductForm(FlaskForm):
    product_code = StringField('Product Code', render_kw={'readonly': True})
    product_type = SelectField(
        'Product Type',
        choices=[
            ('Produce', 'Produce'),
            ('Meats', 'Meats'),
            ('Other Perishable', 'Other Perishable'),
            ('Dry Goods', 'Dry Goods'),
            ('Technology', 'Technology'),
            ('Other', 'Other'),
        ],
        validators=[DataRequired()]
    )
    name = StringField('Product Name', validators=[DataRequired()])
    country_id = SelectField('Country of Origin', coerce=str, validators=[DataRequired()])
    trade_unit = SelectField('Trade Unit', choices=[('UN', 'Unit (Un)'), ('BU', 'Bunch (BU)'), ('KG', 'Kilogram (Kg.)'), ('LBS', 'Pound (Lbs.)')], validators=[DataRequired()])
    fca_cost_per_wu = FloatField('FCA Cost per WU', validators=[Optional()], default=0.0)
    packaging = StringField('Packaging', validators=[Optional()])
    packaging_weight = FloatField('Packaging Weight (per unit)', validators=[Optional()], default=0.0)
    packaging_cost = FloatField('Packaging Cost (per unit)', validators=[Optional()], default=0.0)
    units_per_pack = IntegerField('Units per Pack', validators=[Optional()], default=1)
    currency = StringField('Currency', validators=[DataRequired()])
    other_info = StringField('Other Info', validators=[Optional()])
    submit = SubmitField('Save Product')
