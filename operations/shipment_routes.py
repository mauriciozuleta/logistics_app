from flask import Blueprint, request, jsonify, render_template, flash, redirect, url_for, current_app
from flask_wtf.csrf import generate_csrf
from models import Shipment, ShipmentProduct, Product
from extensions import db
from datetime import datetime
import uuid
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

shipments_bp = Blueprint('shipments_bp', __name__)

def generate_shipment_reference():
    """Generate a unique shipment reference with date prefix and random component"""
    date_prefix = datetime.now().strftime('%Y%m%d')
    unique_id = str(uuid.uuid4())[:8].upper()  # Use first 8 characters of a UUID, uppercased
    return f"SHIP-{date_prefix}-{unique_id}"

@shipments_bp.route('/api/shipments', methods=['POST'])
def create_shipment():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Invalid data'}), 400
        # Debug logging to help diagnose save issues
        try:
            current_app.logger.debug(f"[CREATE_SHIPMENT] CSRF Header: {request.headers.get('X-CSRFToken')}")
            current_app.logger.debug(f"[CREATE_SHIPMENT] Incoming payload keys: {list(data.keys())}")
            current_app.logger.debug(f"[CREATE_SHIPMENT] Product count: {len(data.get('products', []))}")
        except Exception as log_ex:
            current_app.logger.warning(f"[CREATE_SHIPMENT] Logging failure: {log_ex}")
        
        # Generate a reference if one was not provided
        if not data.get('shipment_reference'):
            data['shipment_reference'] = generate_shipment_reference()
        
        # Create Shipment instance
        new_shipment = Shipment(
            shipment_reference=data.get('shipment_reference'),
            shipment_user=data.get('shipment_user'),
            type_of_freight=data.get('type_of_freight'),
            port_of_shipping=data.get('port_of_shipping'),
            consignee_port_of_shipping=data.get('consignee_port_of_shipping'),
            status=data.get('status', 'Draft'),
            
            # Trading Info
            trading_region=data.get('trading_region'),
            trading_regional_manager=data.get('trading_regional_manager'),
            trading_country=data.get('trading_country'),
            trading_branch=data.get('trading_branch'),
            consignee_region=data.get('consignee_region'),
            consignee_regional_manager=data.get('consignee_regional_manager'),
            consignee_country=data.get('consignee_country'),
            consignee_branch=data.get('consignee_branch'),

            # Logistic Info
            departure_route=data.get('departure_route'),
            route_cost=data.get('route_cost'),
            available_payload=data.get('available_payload'),
            type_of_return=data.get('type_of_return'),
            outbound_cost_weight=data.get('outbound_cost_weight'),
            target_cargo_load=data.get('target_cargo_load'),
            est_outb_kg_cost=data.get('est_outb_kg_cost'),
            return_route=data.get('return_route'),
            route_cost_return=data.get('route_cost_return'),
            available_payload_return=data.get('available_payload_return'),
            total_flight_cost_display=data.get('total_flight_cost_display'),
            return_cost_weight=data.get('return_cost_weight'),
            target_cargo_load_return_percentage=data.get('target_cargo_load_return_percentage'),
            est_ret_kg_cost=data.get('est_ret_kg_cost'),

            # Footer Totals
            total_weight=data.get('total_weight'),
            total_product_cost=data.get('total_product_cost'),
            total_export_taxes=data.get('total_export_taxes'),
            total_exporter_profit=data.get('total_exporter_profit'),
            total_fca_cost=data.get('total_fca_cost'),
            total_fca_usd=data.get('total_fca_usd'),
            total_cargo_load_cost=data.get('total_cargo_load_cost'),
            total_air_freight_cost=data.get('total_air_freight_cost'),
            total_cargo_unload_cost=data.get('total_cargo_unload_cost'),
            total_cip_cost=data.get('total_cip_cost'),
            total_import_taxes=data.get('total_import_taxes'),
            total_pr_cost_dat=data.get('total_pr_cost_dat'),
            total_dat_profit=data.get('total_dat_profit'),
            total_shipment_dat_cost=data.get('total_shipment_dat_cost')
        )
        db.session.add(new_shipment)
        
        # Process products for this shipment
        products_data = data.get('products', [])
        # Basic validation: ensure each product has product_id
        missing_ids = [p for p in products_data if not p.get('product_id')]
        if missing_ids:
            db.session.rollback()
            return jsonify({'success': False, 'error': 'One or more products missing product_id; aborting create.', 'count_missing': len(missing_ids)}), 400
        for product_data in products_data:
            new_product = ShipmentProduct(
                shipment=new_shipment,
                shipment_reference=new_shipment.shipment_reference,
                product_id=product_data.get('product_id'),
                product_code=product_data.get('product_code'),
                product_name=product_data.get('product_name'),
                product_category=product_data.get('product_category'),
                country_id=product_data.get('country_id'),
                packaging=product_data.get('packaging'),
                pack_weight=product_data.get('pack_weight'),
                units_per_pack=product_data.get('units_per_pack'),
                packaging_cost=product_data.get('packaging_cost'),
                currency=product_data.get('currency'),
                quantity=product_data.get('quantity'),
                
                # Calculated fields
                total_weight=product_data.get('total_weight'),
                total_product_cost=product_data.get('total_product_cost'),
                export_taxes=product_data.get('export_taxes'),
                exporter_profit=product_data.get('exporter_profit'),
                fca_cost=product_data.get('fca_cost'),
                fca_usd=product_data.get('fca_usd'),
                cargo_load_cost=product_data.get('cargo_load_cost'),
                air_freight_cost=product_data.get('air_freight_cost'),
                cargo_unload_cost=product_data.get('cargo_unload_cost'),
                cip_cost=product_data.get('cip_cost'),
                import_taxes=product_data.get('import_taxes'),
                dat_kg_cost=product_data.get('dat_kg_cost'),
                dat_ea_cost=product_data.get('dat_ea_cost'),
                
                # Pricing and Profitability
                comparative_price=product_data.get('comparative_price'),
                sug_prod_prof_ea=product_data.get('sug_prod_prof_ea'),
                product_profit_percentage=product_data.get('product_profit_percentage'),
                product_profit_amount=product_data.get('product_profit_amount'),
                product_profit_per_kg=product_data.get('product_profit_per_kg'),
                final_dat_price_ea=product_data.get('final_dat_price_ea'),
                total_pr_cost_dat=product_data.get('total_pr_cost_dat'),
                total_dat_profit=product_data.get('total_dat_profit'),
                total_shipment_dat_cost=product_data.get('total_shipment_dat_cost')
            )
            db.session.add(new_product)

        db.session.commit()
        return jsonify({
            'success': True,
            'message': 'Shipment created successfully', 
            'shipment_id': new_shipment.id,
            'shipment_reference': new_shipment.shipment_reference
        }), 201
    
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating shipment: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@shipments_bp.route('/api/shipments/<int:shipment_id>', methods=['GET'])
def get_shipment(shipment_id):
    """Get shipment data for editing or viewing"""
    try:
        shipment = Shipment.query.get(shipment_id)
        
        if not shipment:
            return jsonify({
                'success': False,
                'error': 'Shipment not found'
            }), 404
            
        # Get all products associated with this shipment
        products = ShipmentProduct.query.filter_by(shipment_id=shipment_id).all()
        
        # Convert shipment to a dictionary
        shipment_data = {
            'id': shipment.id,
            'shipment_reference': shipment.shipment_reference,
            'shipment_user': shipment.shipment_user,
            'type_of_freight': shipment.type_of_freight,
            'port_of_shipping': shipment.port_of_shipping,
            'consignee_port_of_shipping': shipment.consignee_port_of_shipping,
            'status': shipment.status or 'Draft',
            
            # Trading Info
            'trading_region': shipment.trading_region,
            'trading_regional_manager': shipment.trading_regional_manager,
            'trading_country': shipment.trading_country,
            'trading_branch': shipment.trading_branch,
            'consignee_region': shipment.consignee_region,
            'consignee_regional_manager': shipment.consignee_regional_manager,
            'consignee_country': shipment.consignee_country,
            'consignee_branch': shipment.consignee_branch,
            
            # Logistic Info
            'departure_route': shipment.departure_route,
            'route_cost': shipment.route_cost,
            'available_payload': shipment.available_payload,
            'type_of_return': shipment.type_of_return,
            'outbound_cost_weight': shipment.outbound_cost_weight,
            'target_cargo_load': shipment.target_cargo_load,
            'est_outb_kg_cost': shipment.est_outb_kg_cost,
            'return_route': shipment.return_route,
            'route_cost_return': shipment.route_cost_return,
            'available_payload_return': shipment.available_payload_return,
            'total_flight_cost_display': shipment.total_flight_cost_display,
            'return_cost_weight': shipment.return_cost_weight,
            'target_cargo_load_return_percentage': shipment.target_cargo_load_return_percentage,
            'est_ret_kg_cost': shipment.est_ret_kg_cost,
            
            # Footer Totals
            'total_weight': shipment.total_weight,
            'total_product_cost': shipment.total_product_cost,
            'total_export_taxes': shipment.total_export_taxes,
            'total_exporter_profit': shipment.total_exporter_profit,
            'total_fca_cost': shipment.total_fca_cost,
            'total_fca_usd': shipment.total_fca_usd,
            'total_cargo_load_cost': shipment.total_cargo_load_cost,
            'total_air_freight_cost': shipment.total_air_freight_cost,
            'total_cargo_unload_cost': shipment.total_cargo_unload_cost,
            'total_cip_cost': shipment.total_cip_cost,
            'total_import_taxes': shipment.total_import_taxes,
            'total_pr_cost_dat': shipment.total_pr_cost_dat,
            'total_dat_profit': shipment.total_dat_profit,
            'total_shipment_dat_cost': shipment.total_shipment_dat_cost,
            
            # Metadata
            'created_at': shipment.created_at.isoformat() if shipment.created_at else None,
            'updated_at': shipment.updated_at.isoformat() if shipment.updated_at else None,
            
            # List of products
            'products': []
        }
        
        # Add each product to the shipment data
        for product in products:
            product_data = {
                'id': product.id,
                'product_id': product.product_id,
                'product_code': product.product_code,
                'product_name': product.product_name,
                'product_category': product.product_category,
                'country_id': product.country_id,
                'packaging': product.packaging,
                'pack_weight': product.pack_weight,
                'units_per_pack': product.units_per_pack,
                'packaging_cost': product.packaging_cost,
                'currency': product.currency,
                'quantity': product.quantity,
                
                # Calculated fields
                'total_weight': product.total_weight,
                'total_product_cost': product.total_product_cost,
                'export_taxes': product.export_taxes,
                'exporter_profit': product.exporter_profit,
                'fca_cost': product.fca_cost,
                'fca_usd': product.fca_usd,
                'cargo_load_cost': product.cargo_load_cost,
                'air_freight_cost': product.air_freight_cost,
                'cargo_unload_cost': product.cargo_unload_cost,
                'cip_cost': product.cip_cost,
                'import_taxes': product.import_taxes,
                'dat_kg_cost': product.dat_kg_cost,
                'dat_ea_cost': product.dat_ea_cost,
                
                # Pricing and Profitability
                'comparative_price': product.comparative_price,
                'sug_prod_prof_ea': product.sug_prod_prof_ea,
                'product_profit_percentage': product.product_profit_percentage,
                'product_profit_amount': product.product_profit_amount,
                'product_profit_per_kg': product.product_profit_per_kg,
                'final_dat_price_ea': product.final_dat_price_ea,
                'total_pr_cost_dat': product.total_pr_cost_dat,
                'total_dat_profit': product.total_dat_profit,
                'total_shipment_dat_cost': product.total_shipment_dat_cost
            }
            shipment_data['products'].append(product_data)
            
        return jsonify({
            'success': True, 
            'shipment': shipment_data,
            'csrf_token': generate_csrf()
        })
        
    except Exception as e:
        logger.error(f"Error retrieving shipment: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@shipments_bp.route('/api/shipments/<int:shipment_id>', methods=['PUT'])
def edit_shipment(shipment_id):
    """Update an existing shipment"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'Invalid data'}), 400
        # Debug logging for update
        try:
            current_app.logger.debug(f"[EDIT_SHIPMENT] CSRF Header: {request.headers.get('X-CSRFToken')}")
            current_app.logger.debug(f"[EDIT_SHIPMENT] Shipment ID: {shipment_id}")
            current_app.logger.debug(f"[EDIT_SHIPMENT] Incoming payload keys: {list(data.keys())}")
            current_app.logger.debug(f"[EDIT_SHIPMENT] Product count: {len(data.get('products', []))}")
        except Exception as log_ex:
            current_app.logger.warning(f"[EDIT_SHIPMENT] Logging failure: {log_ex}")
            
        # Find the shipment to update
        shipment = Shipment.query.get(shipment_id)
        
        if not shipment:
            return jsonify({'success': False, 'error': 'Shipment not found'}), 404
        
        # Update the shipment fields
        # Basic information
        shipment.shipment_user = data.get('shipment_user', shipment.shipment_user)
        shipment.type_of_freight = data.get('type_of_freight', shipment.type_of_freight)
        shipment.port_of_shipping = data.get('port_of_shipping', shipment.port_of_shipping)
        shipment.consignee_port_of_shipping = data.get('consignee_port_of_shipping', shipment.consignee_port_of_shipping)
        shipment.status = data.get('status', shipment.status)
        
        # Trading Info
        shipment.trading_region = data.get('trading_region', shipment.trading_region)
        shipment.trading_regional_manager = data.get('trading_regional_manager', shipment.trading_regional_manager)
        shipment.trading_country = data.get('trading_country', shipment.trading_country)
        shipment.trading_branch = data.get('trading_branch', shipment.trading_branch)
        shipment.consignee_region = data.get('consignee_region', shipment.consignee_region)
        shipment.consignee_regional_manager = data.get('consignee_regional_manager', shipment.consignee_regional_manager)
        shipment.consignee_country = data.get('consignee_country', shipment.consignee_country)
        shipment.consignee_branch = data.get('consignee_branch', shipment.consignee_branch)

        # Logistic Info
        shipment.departure_route = data.get('departure_route', shipment.departure_route)
        shipment.route_cost = data.get('route_cost', shipment.route_cost)
        shipment.available_payload = data.get('available_payload', shipment.available_payload)
        shipment.type_of_return = data.get('type_of_return', shipment.type_of_return)
        shipment.outbound_cost_weight = data.get('outbound_cost_weight', shipment.outbound_cost_weight)
        shipment.target_cargo_load = data.get('target_cargo_load', shipment.target_cargo_load)
        shipment.est_outb_kg_cost = data.get('est_outb_kg_cost', shipment.est_outb_kg_cost)
        shipment.return_route = data.get('return_route', shipment.return_route)
        shipment.route_cost_return = data.get('route_cost_return', shipment.route_cost_return)
        shipment.available_payload_return = data.get('available_payload_return', shipment.available_payload_return)
        shipment.total_flight_cost_display = data.get('total_flight_cost_display', shipment.total_flight_cost_display)
        shipment.return_cost_weight = data.get('return_cost_weight', shipment.return_cost_weight)
        shipment.target_cargo_load_return_percentage = data.get('target_cargo_load_return_percentage', shipment.target_cargo_load_return_percentage)
        shipment.est_ret_kg_cost = data.get('est_ret_kg_cost', shipment.est_ret_kg_cost)

        # Footer Totals
        shipment.total_weight = data.get('total_weight', shipment.total_weight)
        shipment.total_product_cost = data.get('total_product_cost', shipment.total_product_cost)
        shipment.total_export_taxes = data.get('total_export_taxes', shipment.total_export_taxes)
        shipment.total_exporter_profit = data.get('total_exporter_profit', shipment.total_exporter_profit)
        shipment.total_fca_cost = data.get('total_fca_cost', shipment.total_fca_cost)
        shipment.total_fca_usd = data.get('total_fca_usd', shipment.total_fca_usd)
        shipment.total_cargo_load_cost = data.get('total_cargo_load_cost', shipment.total_cargo_load_cost)
        shipment.total_air_freight_cost = data.get('total_air_freight_cost', shipment.total_air_freight_cost)
        shipment.total_cargo_unload_cost = data.get('total_cargo_unload_cost', shipment.total_cargo_unload_cost)
        shipment.total_cip_cost = data.get('total_cip_cost', shipment.total_cip_cost)
        shipment.total_import_taxes = data.get('total_import_taxes', shipment.total_import_taxes)
        shipment.total_pr_cost_dat = data.get('total_pr_cost_dat', shipment.total_pr_cost_dat)
        shipment.total_dat_profit = data.get('total_dat_profit', shipment.total_dat_profit)
        shipment.total_shipment_dat_cost = data.get('total_shipment_dat_cost', shipment.total_shipment_dat_cost)
        
        # Handle the products - first, delete existing products
        ShipmentProduct.query.filter_by(shipment_id=shipment_id).delete()
        
        # Then add the new or updated products
        products_data = data.get('products', [])
        missing_ids = [p for p in products_data if not p.get('product_id')]
        if missing_ids:
            db.session.rollback()
            return jsonify({'success': False, 'error': 'One or more products missing product_id; aborting update.', 'count_missing': len(missing_ids)}), 400
        for product_data in products_data:
            new_product = ShipmentProduct(
                shipment=shipment,
                shipment_reference=shipment.shipment_reference,
                product_id=product_data.get('product_id'),
                product_code=product_data.get('product_code'),
                product_name=product_data.get('product_name'),
                product_category=product_data.get('product_category'),
                country_id=product_data.get('country_id'),
                packaging=product_data.get('packaging'),
                pack_weight=product_data.get('pack_weight'),
                units_per_pack=product_data.get('units_per_pack'),
                packaging_cost=product_data.get('packaging_cost'),
                currency=product_data.get('currency'),
                quantity=product_data.get('quantity'),
                
                # Calculated fields
                total_weight=product_data.get('total_weight'),
                total_product_cost=product_data.get('total_product_cost'),
                export_taxes=product_data.get('export_taxes'),
                exporter_profit=product_data.get('exporter_profit'),
                fca_cost=product_data.get('fca_cost'),
                fca_usd=product_data.get('fca_usd'),
                cargo_load_cost=product_data.get('cargo_load_cost'),
                air_freight_cost=product_data.get('air_freight_cost'),
                cargo_unload_cost=product_data.get('cargo_unload_cost'),
                cip_cost=product_data.get('cip_cost'),
                import_taxes=product_data.get('import_taxes'),
                dat_kg_cost=product_data.get('dat_kg_cost'),
                dat_ea_cost=product_data.get('dat_ea_cost'),
                
                # Pricing and Profitability
                comparative_price=product_data.get('comparative_price'),
                sug_prod_prof_ea=product_data.get('sug_prod_prof_ea'),
                product_profit_percentage=product_data.get('product_profit_percentage'),
                product_profit_amount=product_data.get('product_profit_amount'),
                product_profit_per_kg=product_data.get('product_profit_per_kg'),
                final_dat_price_ea=product_data.get('final_dat_price_ea'),
                total_pr_cost_dat=product_data.get('total_pr_cost_dat'),
                total_dat_profit=product_data.get('total_dat_profit'),
                total_shipment_dat_cost=product_data.get('total_shipment_dat_cost')
            )
            db.session.add(new_product)
        
        db.session.commit()
        return jsonify({
            'success': True,
            'message': f'Shipment {shipment.shipment_reference} updated successfully',
            'shipment_id': shipment.id
        })
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating shipment: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
        
@shipments_bp.route('/api/shipments', methods=['GET'])
def list_shipments():
    """Get a list of all shipments"""
    try:
        # Get query parameters for pagination and filtering
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        search = request.args.get('search', '')
        
        # Start with the base query
        query = Shipment.query
        
        # Apply search filter if provided
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                (Shipment.shipment_reference.ilike(search_term)) | 
                (Shipment.shipment_user.ilike(search_term)) |
                (Shipment.type_of_freight.ilike(search_term)) |
                (Shipment.trading_country.ilike(search_term)) |
                (Shipment.consignee_country.ilike(search_term))
            )
        
        # Order by creation date, newest first
        query = query.order_by(Shipment.created_at.desc())
        
        # Paginate results
        shipments_page = query.paginate(page=page, per_page=per_page)
        
        # Format the results
        result = {
            'success': True,
            'total': shipments_page.total,
            'pages': shipments_page.pages,
            'current_page': page,
            'per_page': per_page,
            'shipments': []
        }
        
        # Add each shipment to the result
        for shipment in shipments_page.items:
            result['shipments'].append({
                'id': shipment.id,
                'shipment_reference': shipment.shipment_reference,
                'shipment_user': shipment.shipment_user,
                'type_of_freight': shipment.type_of_freight,
                'trading_country': shipment.trading_country,
                'consignee_country': shipment.consignee_country,
                'origin_airport': shipment.port_of_shipping,
                'destination_airport': shipment.consignee_port_of_shipping,
                'status': shipment.status or 'Draft',
                'total_weight': shipment.total_weight,
                'total_cip_cost': shipment.total_cip_cost,
                'total_product_cost': shipment.total_product_cost,
                'created_at': shipment.created_at.isoformat() if shipment.created_at else None,
                'updated_at': shipment.updated_at.isoformat() if shipment.updated_at else None
            })
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error listing shipments: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@shipments_bp.route('/api/shipments/<int:shipment_id>', methods=['DELETE'])
def delete_shipment(shipment_id):
    """Delete a shipment"""
    try:
        shipment = Shipment.query.get(shipment_id)
        
        if not shipment:
            return jsonify({
                'success': False,
                'error': 'Shipment not found'
            }), 404
            
        # Delete associated products first
        ShipmentProduct.query.filter_by(shipment_id=shipment_id).delete()
        
        # Delete the shipment
        db.session.delete(shipment)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Shipment {shipment.shipment_reference} deleted successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting shipment: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@shipments_bp.route('/api/get_csrf_token', methods=['GET'])
def get_csrf_token():
    """Get a CSRF token for form protection"""
    return jsonify({
        'success': True,
        'csrf_token': generate_csrf()
    })
