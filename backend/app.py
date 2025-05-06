from flask import Flask, jsonify, request
from flask_cors import CORS
import logging
import os
import sys
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('backend.log')
    ]
)
logger = logging.getLogger(__name__)

# Determine the project root directory and add to path for imports
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))

# Import the TrinoConnection class
try:
    from trino_connection import TrinoConnection
    logger.info("Successfully imported TrinoConnection")
except ImportError:
    try:
        from backend.trino_connection import TrinoConnection
        logger.info("Successfully imported TrinoConnection from backend module")
    except ImportError:
        logger.error("Failed to import TrinoConnection")
        raise

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Error handling
@app.errorhandler(Exception)
def handle_exception(e):
    logger.error(f"Unhandled exception: {str(e)}", exc_info=True)
    return jsonify({"error": str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint to test Trino connection"""
    logger.info("Health check requested")
    try:
        with TrinoConnection() as conn:
            if conn.test_connection():
                logger.info("Health check successful")
                return jsonify({"status": "healthy", "message": "Connected to Trino"})
            else:
                logger.warning("Health check failed - database not responding")
                return jsonify({"status": "unhealthy", "message": "Database connection failed"}), 500
    except Exception as e:
        logger.error(f"Health check error: {str(e)}")
        return jsonify({"status": "unhealthy", "message": str(e)}), 500

@app.route('/api/catalogs', methods=['GET'])
def get_catalogs():
    """Get all available catalogs from Trino"""
    logger.info("Catalogs requested")
    try:
        with TrinoConnection() as conn:
            catalogs = conn.get_all_catalogs()
            logger.info(f"Retrieved {len(catalogs)} catalogs")
            return jsonify({"catalogs": catalogs})
    except Exception as e:
        logger.error(f"Error getting catalogs: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/schemas', methods=['GET'])
def get_schemas():
    """Get schemas for a specific catalog"""
    catalog = request.args.get('catalog')
    if not catalog:
        logger.warning("Schemas requested without catalog parameter")
        return jsonify({"error": "Catalog parameter is required"}), 400
    
    logger.info(f"Schemas requested for catalog: {catalog}")
    try:
        with TrinoConnection() as conn:
            # Switch to the requested catalog
            if not conn.switch_catalog(catalog):
                logger.warning(f"Failed to switch to catalog: {catalog}")
                return jsonify({"error": f"Failed to connect to catalog {catalog}"}), 500
                
            # Execute query to get all schemas in the catalog
            query = f"SHOW SCHEMAS FROM {catalog}"
            df = conn.execute_query(query)
            schemas = df['Schema'].tolist()
            logger.info(f"Retrieved {len(schemas)} schemas from catalog {catalog}")
            return jsonify({"schemas": schemas})
    except Exception as e:
        logger.error(f"Error getting schemas for catalog {catalog}: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/tables', methods=['GET'])
def get_tables():
    """Get tables for a specific schema within a catalog"""
    catalog = request.args.get('catalog')
    schema = request.args.get('schema')
    
    if not catalog or not schema:
        logger.warning("Tables requested without required parameters")
        return jsonify({"error": "Both catalog and schema parameters are required"}), 400
    
    logger.info(f"Tables requested for catalog: {catalog}, schema: {schema}")
    try:
        with TrinoConnection() as conn:
            # Switch to the requested catalog and schema
            if not conn.switch_catalog(catalog, schema):
                logger.warning(f"Failed to switch to catalog: {catalog}, schema: {schema}")
                return jsonify({"error": f"Failed to connect to catalog {catalog} and schema {schema}"}), 500
                
            # Get tables in the schema
            tables = conn.get_tables(schema)
            logger.info(f"Retrieved {len(tables)} tables from catalog {catalog}, schema {schema}")
            return jsonify({"tables": tables})
    except Exception as e:
        logger.error(f"Error getting tables for catalog {catalog}, schema {schema}: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Additional utility endpoint to get table details (not required by frontend yet, but could be useful)
@app.route('/api/table/details', methods=['GET'])
def get_table_details():
    """Get details for a specific table"""
    catalog = request.args.get('catalog')
    schema = request.args.get('schema')
    table = request.args.get('table')
    
    if not catalog or not schema or not table:
        logger.warning("Table details requested without required parameters")
        return jsonify({"error": "Catalog, schema, and table parameters are required"}), 400
    
    logger.info(f"Table details requested for {catalog}.{schema}.{table}")
    try:
        with TrinoConnection() as conn:
            # Switch to the requested catalog and schema
            if not conn.switch_catalog(catalog, schema):
                logger.warning(f"Failed to switch to catalog: {catalog}, schema: {schema}")
                return jsonify({"error": f"Failed to connect to catalog {catalog} and schema {schema}"}), 500
                
            # Get column information
            query = f"""
            SELECT column_name, data_type, is_nullable 
            FROM {catalog}.information_schema.columns 
            WHERE table_catalog = '{catalog}' 
              AND table_schema = '{schema}' 
              AND table_name = '{table}'
            ORDER BY ordinal_position
            """
            df = conn.execute_query(query)
            columns = df.to_dict('records')
            logger.info(f"Retrieved {len(columns)} columns for table {table}")
            return jsonify({"columns": columns})
    except Exception as e:
        logger.error(f"Error getting details for table {catalog}.{schema}.{table}: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    logger.info("Starting Flask application")
    # Set default port to 5000, but allow override through environment variables
    port = int(os.environ.get('PORT', 5000))
    # In production, you might want to disable debug mode
    debug = os.environ.get('FLASK_DEBUG', 'True').lower() == 'true'
    # Run the application
    app.run(host='0.0.0.0', port=port, debug=debug)

