from datetime import datetime
from extensions import db

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


# Region model
class Region(BaseModel):
    __tablename__ = 'regions'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64), unique=True, nullable=False)
    manager_name = db.Column(db.String(128), nullable=True)

    countries = db.relationship('CountryTradeInfo', backref='region', lazy=True)

    def __repr__(self):
        return f"<Region {self.name} (Manager: {self.manager_name})>"

# CountryTradeInfo model
class CountryTradeInfo(BaseModel):
    __tablename__ = 'country_trade_info'

    id = db.Column(db.Integer, primary_key=True)
    country_id = db.Column(db.String(10), db.ForeignKey('countries.country_code'), nullable=False)
    region_id = db.Column(db.Integer, db.ForeignKey('regions.id'), nullable=False)

    operational_cost_year = db.Column(db.Float, nullable=True)
    revenue_taxes = db.Column(db.Float, nullable=True)
    export_profit_pct = db.Column(db.Float, nullable=True)
    export_sales_tax = db.Column(db.Float, nullable=True)
    export_other_taxes = db.Column(db.Float, nullable=True)
    export_other_cost = db.Column(db.Float, nullable=True)
    import_profit_pct = db.Column(db.Float, nullable=True)
    import_taxes = db.Column(db.Float, nullable=True)
    import_other_taxes = db.Column(db.Float, nullable=True)
    import_other_cost = db.Column(db.Float, nullable=True)
    other_taxes = db.Column(db.Float, nullable=True)
    other_costs = db.Column(db.Float, nullable=True)
    additional_info = db.Column(db.String(500), nullable=True)

    branches = db.relationship('Branch', backref='country_trade_info', lazy=True)
    country = db.relationship('Country', backref='country_trade_info')

    def __repr__(self):
        return f"<CountryTradeInfo {self.country_id} (Region: {self.region_id})>"

# Branch model
class Branch(BaseModel):
    __tablename__ = 'branches'

    id = db.Column(db.Integer, primary_key=True)
    branch_code = db.Column(db.String(10), unique=True, nullable=True)
    country_trade_info_id = db.Column(db.Integer, db.ForeignKey('country_trade_info.id'), nullable=False)
    city = db.Column(db.String(100), nullable=True)
    name = db.Column(db.String(128), nullable=True)
    type_of_freight = db.Column(db.String(64), nullable=True)
    airport_iata = db.Column(db.String(3), nullable=True)
    port_code = db.Column(db.String(64), nullable=True)
    ground_terminal_code = db.Column(db.String(64), nullable=True)
    operational_cost_year = db.Column(db.Float, nullable=True)

    def __repr__(self):
        return f"<Branch {self.name} ({self.city})>"


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
    aircraft_id = db.Column(db.String, nullable=False)
    route_type = db.Column(db.String(20), nullable=False)  # one-way, round-trip, multiple
    
    # Airport references
    from_airport_id = db.Column(db.Integer, nullable=False)
    to_airport_id = db.Column(db.Integer, nullable=False)
    finish_airport_id = db.Column(db.Integer)  # Only for multiple routes
    
    # Additional fields for enhanced saving functionality
    route_summary = db.Column(db.String(255))
    aircraft_name = db.Column(db.String(128))
    from_airport_name = db.Column(db.String(255))
    to_airport_name = db.Column(db.String(255))
    finish_airport_name = db.Column(db.String(255))
    
    # Fields for a single leg's data
    total_distance_nm = db.Column(db.Float)
    total_flight_time_hours = db.Column(db.Float)
    total_adjusted_flight_time_hours = db.Column(db.Float)
    total_fuel_gallons = db.Column(db.Float)
    total_fuel_cost = db.Column(db.Float)
    total_block_hours_cost = db.Column(db.Float)
    total_overflight_cost = db.Column(db.Float)
    total_cost = db.Column(db.Float)
    
    # JSON fields for detailed leg and payload data
    leg_details = db.Column(db.Text)  # JSON string of leg details
    payload_details = db.Column(db.Text)  # JSON string of payload details
    
    # Payload Data for the leg
    leg1_oew_lbs = db.Column(db.Float)
    leg1_fuel_weight_lbs = db.Column(db.Float)
    leg1_max_payload_lbs = db.Column(db.Float)
    leg1_no_tank_tow_lbs = db.Column(db.Float)
    leg1_avail_extra_fuel_lbs = db.Column(db.Float)
    leg1_tank_tow_lbs = db.Column(db.Float)
    
    # Status and metadata
    status = db.Column(db.String(20), default='active')  # active, archived, draft
    notes = db.Column(db.Text)
    created_by = db.Column(db.String(128))
    
    # Relationships
    aircraft = db.relationship('Aircraft', backref='routes')
    from_airport = db.relationship('Airport', foreign_keys=[from_airport_id], backref='routes_from')
    to_airport = db.relationship('Airport', foreign_keys=[to_airport_id], backref='routes_to')
    finish_airport = db.relationship('Airport', foreign_keys=[finish_airport_id], backref='routes_finish')
    
    __table_args__ = (
        db.ForeignKeyConstraint(['aircraft_id'], ['aircraft.id'], name='fk_route_aircraft_id'),
        db.ForeignKeyConstraint(['from_airport_id'], ['airports.id'], name='fk_route_from_airport_id'),
        db.ForeignKeyConstraint(['to_airport_id'], ['airports.id'], name='fk_route_to_airport_id'),
        db.ForeignKeyConstraint(['finish_airport_id'], ['airports.id'], name='fk_route_finish_airport_id'),
    )

    def __repr__(self):
        return f"<Route {self.route_name or f'{self.leg1_route}'} ({self.route_type})>"


class Shipment(BaseModel):
    __tablename__ = 'shipments'

    id = db.Column(db.Integer, primary_key=True)
    shipment_reference = db.Column(db.String(64), unique=True, nullable=False)
    shipment_user = db.Column(db.String(128))
    type_of_freight = db.Column(db.String(64))
    port_of_shipping = db.Column(db.String(128))
    consignee_port_of_shipping = db.Column(db.String(128))
    status = db.Column(db.String(32), default='Draft')

    # Trading Information
    trading_region = db.Column(db.String(128))
    trading_regional_manager = db.Column(db.String(128))
    trading_country = db.Column(db.String(128))
    trading_branch = db.Column(db.String(128))
    consignee_region = db.Column(db.String(128))
    consignee_regional_manager = db.Column(db.String(128))
    consignee_country = db.Column(db.String(128))
    consignee_branch = db.Column(db.String(128))

    # Logistic Information
    departure_route = db.Column(db.String(128))
    route_cost = db.Column(db.Float)
    available_payload = db.Column(db.Float)
    type_of_return = db.Column(db.String(32))
    outbound_cost_weight = db.Column(db.Float)
    target_cargo_load = db.Column(db.Float)
    est_outb_kg_cost = db.Column(db.Float)
    
    return_route = db.Column(db.String(128))
    route_cost_return = db.Column(db.Float)
    available_payload_return = db.Column(db.Float)
    total_flight_cost_display = db.Column(db.Float)
    return_cost_weight = db.Column(db.Float)
    target_cargo_load_return_percentage = db.Column(db.Float)
    est_ret_kg_cost = db.Column(db.Float)

    # Footer Totals from Product Table
    total_weight = db.Column(db.Float)
    total_product_cost = db.Column(db.Float)
    total_export_taxes = db.Column(db.Float)
    total_exporter_profit = db.Column(db.Float)
    total_fca_cost = db.Column(db.Float)
    total_fca_usd = db.Column(db.Float)
    total_cargo_load_cost = db.Column(db.Float)
    total_air_freight_cost = db.Column(db.Float)
    total_cargo_unload_cost = db.Column(db.Float)
    total_cip_cost = db.Column(db.Float)
    total_import_taxes = db.Column(db.Float)
    total_pr_cost_dat = db.Column(db.Float)
    total_dat_profit = db.Column(db.Float)
    total_shipment_dat_cost = db.Column(db.Float)

    # Relationships
    products = db.relationship('ShipmentProduct', backref='shipment', lazy='dynamic', cascade="all, delete-orphan")

    def __repr__(self):
        return f'<Shipment {self.shipment_reference}>'


class ShipmentProduct(BaseModel):
    __tablename__ = 'shipment_products'

    id = db.Column(db.Integer, primary_key=True)
    shipment_id = db.Column(db.Integer, db.ForeignKey('shipments.id'), nullable=False)
    shipment_reference = db.Column(db.String(64), nullable=False)

    # Product Info from original Product model
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    product_code = db.Column(db.String(16))
    product_name = db.Column(db.String(128), nullable=False)
    product_category = db.Column(db.String(64))
    country_id = db.Column(db.String(10))
    packaging = db.Column(db.String(64))
    pack_weight = db.Column(db.Float)
    units_per_pack = db.Column(db.Integer)
    packaging_cost = db.Column(db.Float)
    currency = db.Column(db.String(4))

    # User input
    quantity = db.Column(db.Integer) # 'Amount' in the table

    # Calculated fields based on user input and product data
    total_weight = db.Column(db.Float)
    total_product_cost = db.Column(db.Float)
    export_taxes = db.Column(db.Float)
    exporter_profit = db.Column(db.Float)
    fca_cost = db.Column(db.Float)
    fca_usd = db.Column(db.Float)
    cargo_load_cost = db.Column(db.Float)
    air_freight_cost = db.Column(db.Float)
    cargo_unload_cost = db.Column(db.Float)
    cip_cost = db.Column(db.Float)
    import_taxes = db.Column(db.Float)
    dat_kg_cost = db.Column(db.Float)
    dat_ea_cost = db.Column(db.Float)
    
    # Pricing and Profitability
    comparative_price = db.Column(db.Float)
    sug_prod_prof_ea = db.Column(db.Float)
    product_profit_percentage = db.Column(db.Float)
    product_profit_amount = db.Column(db.Float)
    product_profit_per_kg = db.Column(db.Float)
    final_dat_price_ea = db.Column(db.Float)
    total_pr_cost_dat = db.Column(db.Float)
    total_dat_profit = db.Column(db.Float)
    total_shipment_dat_cost = db.Column(db.Float)

    product = db.relationship('Product', backref='shipment_products')

    def __repr__(self):
        return f'<ShipmentProduct {self.product_name} for Shipment {self.shipment_id}>'


class CompetitivePrice(db.Model):
    __tablename__ = 'competitive_prices'
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)  # Fixed FK
    product_code = db.Column(db.String(32), nullable=False)
    country = db.Column(db.String(64), nullable=False)
    origin = db.Column(db.String(64), nullable=False)
    price_to_compare = db.Column(db.Float, nullable=False)
    updated_date = db.Column(db.Date, nullable=False)
    source = db.Column(db.String(16), nullable=True)  # 'AI' or 'Manual'
    product = db.relationship('Product', backref='competitive_prices')