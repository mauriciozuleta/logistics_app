
from datetime import datetime
from extensions import db
# Then define your models like normal

# Optional BaseModel for shared fields
class BaseModel(db.Model):
    __abstract__ = True
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)


class Country(db.Model):
    __tablename__ = 'countries'

    country_code = db.Column(db.String(10), primary_key=True)
    country_name = db.Column(db.String(64), nullable=False)
    currency_code = db.Column(db.String(4), nullable=False)

    products = db.relationship('Product', backref='country', lazy=True)


class Product(BaseModel):
    __tablename__ = 'products'

    id = db.Column(db.Integer, primary_key=True)
    product_type = db.Column(db.String(64), nullable=False)  # 👈 New field
    name = db.Column(db.String(128), nullable=False)
    country_id = db.Column(db.String(10), db.ForeignKey('countries.country_code'))
    trade_unit = db.Column(db.Integer)
    fca_cost_per_wu = db.Column(db.Float)
    packaging = db.Column(db.String(64))
    packaging_weight = db.Column(db.Float)
    units_per_pack = db.Column(db.Integer)
    packaging_cost = db.Column(db.Float)
    other_info = db.Column(db.Text)
    currency = db.Column(db.String(4))
    
    def __repr__(self):
        return f"<Product {self.name}>"


class Aircraft(BaseModel):
    __tablename__ = 'aircraft'

    id = db.Column(db.String, primary_key=True)
    manufacturer = db.Column(db.String(64))
    model = db.Column(db.String(64))
    short_name = db.Column(db.String(32))

    mtow_kg = db.Column(db.Float)
    mtow_lbs = db.Column(db.Float)
    mldgw_kg = db.Column(db.Float)
    mldgw_lbs = db.Column(db.Float)
    zero_fuel_kg = db.Column(db.Float)
    zero_fuel_lbs = db.Column(db.Float)
    max_ramp_kg = db.Column(db.Float)
    max_ramp_lbs = db.Column(db.Float)

    empty_weight_kg = db.Column(db.Float)
    empty_weight_lbs = db.Column(db.Float)
    max_payload_kg = db.Column(db.Float)
    max_payload_lbs = db.Column(db.Float)

    fuel_capacity_gal = db.Column(db.Float)
    fuel_capacity_lbs = db.Column(db.Float)
    fuel_burn_gal = db.Column(db.Float)
    fuel_burn_lbs = db.Column(db.Float)
    min_fuel_landed_gal = db.Column(db.Float)
    min_fuel_landed_lbs = db.Column(db.Float)
    min_fuel_alternate_gal = db.Column(db.Float)
    min_fuel_alternate_lbs = db.Column(db.Float)

    cargo_positions_main_deck = db.Column(db.Integer)
    cargo_positions_lower_deck = db.Column(db.Integer)

    acmi_cost = db.Column(db.Float)


# Trader model
class Trader(BaseModel):
    __tablename__ = 'traders'

    id = db.Column(db.Integer, primary_key=True)
    country_id = db.Column(db.String(10), db.ForeignKey('countries.country_code'), nullable=False)
    name = db.Column(db.String(128), nullable=False)

    # Export info
    export_year_operating_costs = db.Column(db.Float)
    export_operating_expenses_pct = db.Column(db.Float)
    export_profit_pct = db.Column(db.Float)
    export_sales_tax = db.Column(db.Float)
    export_other_taxes = db.Column(db.Float)

    # Import info
    import_year_operating_costs = db.Column(db.Float)
    import_operating_expenses_pct = db.Column(db.Float)
    import_profit_pct = db.Column(db.Float)
    import_import_taxes = db.Column(db.Float)
    import_sales_tax = db.Column(db.Float)
    import_other_taxes = db.Column(db.Float)

    country = db.relationship('Country', backref='traders')

    def __repr__(self):
        return f"<Trader {self.name} ({self.country_id})>"


class Airport(BaseModel):
    __tablename__ = 'airports'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    iata_code = db.Column(db.String(3), unique=True, nullable=False)
    city = db.Column(db.String(100), nullable=False)

    country_id = db.Column(db.Integer, db.ForeignKey('countries.country_code'), nullable=False)
    country = db.relationship('Country', backref='airports')

    fuel_cost_gl = db.Column(db.Float)
    cargo_handling_cost_kg = db.Column(db.Float)
    airport_fee = db.Column(db.Float)
    turnaround_cost = db.Column(db.Float)
    other_desc = db.Column(db.String(100))
    other_cost = db.Column(db.Float)

    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    geo_source = db.Column(db.String(50))
    last_verified_at = db.Column(db.DateTime)