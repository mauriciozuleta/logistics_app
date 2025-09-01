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
    region = db.Column(db.String(32), nullable=True)  # Added region column

    products = db.relationship('Product', backref='country', lazy=True)


class Product(BaseModel):
    __tablename__ = 'products'

    id = db.Column(db.Integer, primary_key=True)
    product_code = db.Column(db.String(16), unique=True, nullable=False)
    product_type = db.Column(db.String(64), nullable=False)  # 👈 New field
    name = db.Column(db.String(128), nullable=False)
    country_id = db.Column(db.String(10), db.ForeignKey('countries.country_code'))
    trade_unit = db.Column(db.String(16))
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
    cruise_speed = db.Column(db.Float)

    acmi_cost = db.Column(db.Float)





# Trader model

class Trader(BaseModel):
    __tablename__ = 'traders'

    id = db.Column(db.Integer, primary_key=True)
    trader_code = db.Column(db.String(10), unique=True, nullable=True)  # Custom ID like TR001
    country_id = db.Column(db.String(10), db.ForeignKey('countries.country_code'), nullable=True)
    city = db.Column(db.String(100), nullable=True)
    name = db.Column(db.String(128), nullable=True)  # Port Name
    type_of_freight = db.Column(db.String(64), nullable=True)
    airport_iata = db.Column(db.String(3), nullable=True)
    terminal = db.Column(db.String(64), nullable=True)  # Added terminal field

    # Manager/Branch distinction
    is_manager = db.Column(db.Boolean, default=False)  # Added field for manager/branch distinction
    region = db.Column(db.String(64), nullable=True)
    manager_name = db.Column(db.String(128), nullable=True)
    operational_cost_year = db.Column(db.Float)

    # Section 1: Trader/Branch Information
    revenue_taxes = db.Column(db.Float)

    # Section 2: Export Costs
    export_profit_pct = db.Column(db.Float)
    export_sales_tax = db.Column(db.Float)
    export_other_taxes = db.Column(db.Float)

    # Section 3: Import Costs
    import_profit_pct = db.Column(db.Float)
    import_taxes = db.Column(db.Float)


    # Additional fields
    other_taxes = db.Column(db.Float)

    country = db.relationship('Country', backref='traders')

    def __repr__(self):
        if hasattr(self, 'is_manager') and self.is_manager:
            return f"<Manager {self.manager_name} ({self.region})>"
        return f"<Trader {self.name} ({self.city}, {self.country_id})>"


class Airport(BaseModel):
    __tablename__ = 'airports'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    iata_code = db.Column(db.String(3), unique=True, nullable=False)
    city = db.Column(db.String(100), nullable=False)

    country_id = db.Column(db.String(10), db.ForeignKey('countries.country_code'), nullable=False)
    country = db.relationship('Country', backref='airports')

    fuel_cost_gl = db.Column(db.Float)
    cargo_handling_cost_kg = db.Column(db.Float)
    airport_fee = db.Column(db.Float)
    turnaround_cost = db.Column(db.Float)
    other_desc = db.Column(db.String(100))
    other_cost = db.Column(db.Float)

    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    altitude_ft = db.Column(db.Float)
    geo_source = db.Column(db.String(50))
    last_verified_at = db.Column(db.DateTime)


class Route(BaseModel):
    __tablename__ = 'routes'

    id = db.Column(db.Integer, primary_key=True)
    route_name = db.Column(db.String(128))
    aircraft_id = db.Column(db.String, db.ForeignKey('aircraft.id'), nullable=False)
    route_type = db.Column(db.String(20), nullable=False)  # one-way, round-trip, multiple
    
    # Airport references
    from_airport_id = db.Column(db.Integer, db.ForeignKey('airports.id'), nullable=False)
    to_airport_id = db.Column(db.Integer, db.ForeignKey('airports.id'), nullable=False)
    finish_airport_id = db.Column(db.Integer, db.ForeignKey('airports.id'))  # Only for multiple routes
    
    # Route Summary Data (Totals) - Original columns
    total_distance = db.Column(db.Float)
    total_flight_time = db.Column(db.Float)
    total_route_fuel_gls = db.Column(db.Float)
    total_bh_cost_usd = db.Column(db.Float)
    total_fuel_cost_usd = db.Column(db.Float)
    total_leg_cost_usd = db.Column(db.Float)
    
    # Additional fields for enhanced saving functionality
    route_summary = db.Column(db.String(255))
    aircraft_name = db.Column(db.String(128))
    from_airport_name = db.Column(db.String(255))
    to_airport_name = db.Column(db.String(255))
    finish_airport_name = db.Column(db.String(255))
    
    # New fields to match the save functionality
    total_distance_nm = db.Column(db.Float)
    total_flight_time_hours = db.Column(db.Float)
    total_adjusted_flight_time_hours = db.Column(db.Float)
    total_fuel_gallons = db.Column(db.Float)
    total_fuel_cost = db.Column(db.Float)
    total_block_hours_cost = db.Column(db.Float)
    total_cost = db.Column(db.Float)
    
    # JSON fields for detailed leg and payload data
    leg_details = db.Column(db.Text)  # JSON string of leg details
    payload_details = db.Column(db.Text)  # JSON string of payload details
    
    # Leg 1 Data
    leg1_route = db.Column(db.String(128))
    leg1_distance = db.Column(db.Float)
    leg1_flight_time = db.Column(db.Float)
    leg1_adjusted_flight_time = db.Column(db.Float)
    leg1_route_fuel_gls = db.Column(db.Float)
    leg1_bh_cost_usd = db.Column(db.Float)
    leg1_fuel_cost_usd = db.Column(db.Float)
    leg1_total_cost_usd = db.Column(db.Float)
    
    # Leg 1 Payload Data
    leg1_oew_lbs = db.Column(db.Float)
    leg1_fuel_weight_lbs = db.Column(db.Float)
    leg1_max_payload_lbs = db.Column(db.Float)
    leg1_no_tank_tow_lbs = db.Column(db.Float)
    leg1_avail_extra_fuel_lbs = db.Column(db.Float)
    leg1_tank_tow_lbs = db.Column(db.Float)
    
    # Leg 2 Data (for round-trip and multiple routes)
    leg2_route = db.Column(db.String(128))
    leg2_distance = db.Column(db.Float)
    leg2_flight_time = db.Column(db.Float)
    leg2_adjusted_flight_time = db.Column(db.Float)
    leg2_route_fuel_gls = db.Column(db.Float)
    leg2_bh_cost_usd = db.Column(db.Float)
    leg2_fuel_cost_usd = db.Column(db.Float)
    leg2_total_cost_usd = db.Column(db.Float)
    
    # Leg 2 Payload Data
    leg2_oew_lbs = db.Column(db.Float)
    leg2_fuel_weight_lbs = db.Column(db.Float)
    leg2_max_payload_lbs = db.Column(db.Float)
    leg2_no_tank_tow_lbs = db.Column(db.Float)
    leg2_avail_extra_fuel_lbs = db.Column(db.Float)
    leg2_tank_tow_lbs = db.Column(db.Float)
    
    # Status and metadata
    status = db.Column(db.String(20), default='active')  # active, archived, draft
    notes = db.Column(db.Text)
    created_by = db.Column(db.String(128))
    
    # Relationships
    aircraft = db.relationship('Aircraft', backref='routes')
    from_airport = db.relationship('Airport', foreign_keys=[from_airport_id], backref='routes_from')
    to_airport = db.relationship('Airport', foreign_keys=[to_airport_id], backref='routes_to')
    finish_airport = db.relationship('Airport', foreign_keys=[finish_airport_id], backref='routes_finish')
    
    def __repr__(self):
        return f"<Route {self.route_name or f'{self.leg1_route}'} ({self.route_type})>"


class Shipment(BaseModel):
    __tablename__ = 'shipments'

    id = db.Column(db.Integer, primary_key=True)
    shipment_reference = db.Column(db.String(64), unique=True, nullable=False)

    # Relationships to other models for data integrity
    shipper_id = db.Column(db.Integer, db.ForeignKey('traders.id'), nullable=False)
    consignee_id = db.Column(db.Integer, db.ForeignKey('traders.id'), nullable=False)
    departure_route_id = db.Column(db.Integer, db.ForeignKey('routes.id'), nullable=False)
    return_route_id = db.Column(db.Integer, db.ForeignKey('routes.id'))

    # Denormalized/calculated fields from the form
    first_leg_route = db.Column(db.String(64), nullable=False) # Kept for display/reference
    first_leg_distance = db.Column(db.Float)
    first_leg_ft = db.Column(db.Float)
    first_leg_cost = db.Column(db.Float)
    first_leg_payload = db.Column(db.Float)
    second_leg_route = db.Column(db.String(64)) # Kept for display/reference
    second_leg_distance = db.Column(db.Float)
    second_leg_ft = db.Column(db.Float)
    second_leg_cost = db.Column(db.Float)
    second_leg_payload = db.Column(db.Float)
    selected_aircraft = db.Column(db.String(64))
    return_type = db.Column(db.String(32))

    outbound_cost_weight = db.Column(db.Float)
    outbound_tcl = db.Column(db.Float)
    outbound_kg_cost = db.Column(db.Float)
    return_cost_weight = db.Column(db.Float)
    return_tcl = db.Column(db.Float)
    return_kg_cost = db.Column(db.Float)

    # Relationships for easy access to related objects
    shipper = db.relationship('Trader', foreign_keys=[shipper_id], backref='shipments_as_shipper')
    consignee = db.relationship('Trader', foreign_keys=[consignee_id], backref='shipments_as_consignee')
    departure_route = db.relationship('Route', foreign_keys=[departure_route_id], backref='shipments_departing')
    return_route = db.relationship('Route', foreign_keys=[return_route_id], backref='shipments_returning')

    def __repr__(self):
        return f'<Shipment {self.shipment_reference}>'

class CompetitivePrice(db.Model):
    __tablename__ = 'competitive_prices'
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)  # Fixed FK
    product_code = db.Column(db.String(32), nullable=False)
    country = db.Column(db.String(64), nullable=False)
    origin = db.Column(db.String(64), nullable=False)
    price_to_compare = db.Column(db.Float, nullable=False)
    updated_date = db.Column(db.Date, nullable=False)
    product = db.relationship('Product', backref='competitive_prices')