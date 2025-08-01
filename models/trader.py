from app import db

class Trader(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    country_id = db.Column(db.String(3), db.ForeignKey('country.country_code'), nullable=False)
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
