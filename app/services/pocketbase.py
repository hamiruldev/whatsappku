from pocketbase import PocketBase
from flask import current_app
import os

# Initialize PocketBase client
pb = PocketBase(os.getenv('POCKETBASE_URL', 'https://hamirulhafizal.pockethost.io'))

def init_admin():
    """Initialize PocketBase admin client"""
    try:
        admin_email = os.getenv('POCKETBASE_ADMIN_EMAIL')
        admin_password = os.getenv('POCKETBASE_ADMIN_PASSWORD')
        
        if admin_email and admin_password:
            pb.admins.auth_with_password(admin_email, admin_password)
            current_app.logger.info("PocketBase admin authentication successful")
        else:
            current_app.logger.warning("PocketBase admin credentials not provided")
    except Exception as e:
        current_app.logger.error(f"PocketBase admin authentication failed: {str(e)}")

def get_collection(collection_name):
    """Get a PocketBase collection"""
    return pb.collection(collection_name)

def create_record(collection_name, data):
    """Create a new record in a collection"""
    try:
        collection = get_collection(collection_name)
        return collection.create(data)
    except Exception as e:
        current_app.logger.error(f"Error creating record in {collection_name}: {str(e)}")
        raise

def update_record(collection_name, record_id, data):
    """Update an existing record in a collection"""
    try:
        collection = get_collection(collection_name)
        return collection.update(record_id, data)
    except Exception as e:
        current_app.logger.error(f"Error updating record in {collection_name}: {str(e)}")
        raise

def delete_record(collection_name, record_id):
    """Delete a record from a collection"""
    try:
        collection = get_collection(collection_name)
        return collection.delete(record_id)
    except Exception as e:
        current_app.logger.error(f"Error deleting record from {collection_name}: {str(e)}")
        raise

def get_record(collection_name, record_id):
    """Get a single record from a collection"""
    try:
        collection = get_collection(collection_name)
        return collection.get_one(record_id)
    except Exception as e:
        current_app.logger.error(f"Error getting record from {collection_name}: {str(e)}")
        raise

def list_records(collection_name, page=1, per_page=50, filter_str=None):
    """List records from a collection with optional filtering"""
    try:
        collection = get_collection(collection_name)
        return collection.get_list(page, per_page, { "filter": filter_str, "expand": "session"})
    except Exception as e:
        current_app.logger.error(f"Error listing records from {collection_name}: {str(e)}")
        raise

def get_first_record(collection_name, filter_str):
    """Get the first record that matches a filter"""
    try:
        collection = get_collection(collection_name)
        return collection.get_first_list_item(filter_str)
    except Exception as e:
        current_app.logger.error(f"Error getting first record from {collection_name}: {str(e)}")
        raise

def fetch_lov(collection_name):
    try:
        # Access the 'whatsappku_lov' collection
        collection = get_collection(collection_name)
        
        # Fetch the list of values (LOV) with pagination
        result = collection.get_list(1, 50)  # Fetch page 1 with 50 records per page
        
        # Debugging: Print the result object
        print(f"Fetched result: {result}")
        
        # Check if items are present
        if result and hasattr(result, 'items'):
            for item in result.items:
                print(item)  # Or handle the item as needed
            return result.items
        else:
            print("No items found in the result.")
            return None
    except Exception as e:
        print(f"Error fetching LOV: {e}")
        return None