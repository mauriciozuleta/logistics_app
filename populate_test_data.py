#!/usr/bin/env python3
"""
Script to populate test data in the ImportedProductData table
for verifying the "Send to Shipment" functionality works correctly.
"""

from app import app
from models import ImportedProductData, Product, db

def populate_test_data():
    """Populate ImportedProductData with sample data from existing products"""
    with app.app_context():
        try:
            # Get some existing products from the database
            products = Product.query.limit(5).all()
            
            if not products:
                print("❌ No products found in database. Please add some products first.")
                return
            
            print(f"📦 Found {len(products)} products to import")
            
            # Clear existing test data
            ImportedProductData.query.delete()
            print("🧹 Cleared existing ImportedProductData records")
            
            # Create ImportedProductData records
            created_count = 0
            for i, product in enumerate(products, 1):
                imported_data = ImportedProductData(
                    product_id=product.id,
                    name=product.name,
                    country_id=product.country_id,
                    pack_type=product.packaging,
                    units_pack=product.units_per_pack,
                    pack_weight=product.packaging_weight,
                    pack_cost=product.packaging_cost,
                    fca_cost=product.fca_cost_per_wu,
                    # Add some calculated test values
                    profit=15.5,  # 15.5% profit margin
                    final_pack_cost=(product.packaging_cost or 0) * 1.155 if product.packaging_cost else None,
                    pack_usd=(product.packaging_cost or 0) * 1.1 if product.packaging_cost else None,
                    amount=100.0 + (i * 25),  # Test amounts: 125, 150, 175, etc.
                    total_prod_cost=(product.fca_cost_per_wu or 0) * (100 + i * 25) if product.fca_cost_per_wu else None,
                    sales_tax=8.25,  # 8.25% sales tax
                    load_cost=50.0 + (i * 10),  # Loading costs: 60, 70, 80, etc.
                    freight_cost=200.0 + (i * 50),  # Freight costs: 250, 300, 350, etc.
                    unload_cost=40.0 + (i * 5),  # Unloading costs: 45, 50, 55, etc.
                    import_taxes=12.5,  # 12.5% import taxes
                    import_profit=10.0,  # 10% import profit
                    import_sales_tax=6.75,  # 6.75% import sales tax
                    wu_cost=(product.fca_cost_per_wu or 0) * 1.25 if product.fca_cost_per_wu else None,
                    unit_cost=(product.fca_cost_per_wu or 0) * 1.45 if product.fca_cost_per_wu else None,
                )
                
                db.session.add(imported_data)
                created_count += 1
                
                print(f"➕ Added: {product.name} ({product.country_id}) - Pack: {product.packaging or 'N/A'}")
            
            # Commit all changes
            db.session.commit()
            
            print(f"\n✅ Successfully created {created_count} ImportedProductData records!")
            print(f"🔗 View them at: http://127.0.0.1:5000/coredata/view-imported-data-structure")
            
            # Show summary of created records
            total_records = ImportedProductData.query.count()
            print(f"📊 Total records in ImportedProductData table: {total_records}")
            
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error: {str(e)}")
            print(f"Error type: {type(e)}")

if __name__ == "__main__":
    populate_test_data()
