import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    # Flask Configuration
    SECRET_KEY = os.getenv('SECRET_KEY', 'default-secret-key')
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    
    # WhatsApp API Configuration
    WAHA_API_URL = os.getenv('WAHA_API_URL')
    WAHA_SESSION = os.getenv('WAHA_SESSION')
    
    # Google Cloud Configuration
    PROJECT_ID = os.getenv('PROJECT_ID')
    REGION = os.getenv('REGION')
    
    # PocketBase Configuration
    POCKETBASE_URL = os.getenv('POCKETBASE_URL')
    
    # Public Gold API
    PUBLIC_GOLD_URL = os.getenv('PUBLIC_GOLD_URL')

class DevelopmentConfig(Config):
    DEBUG = True
    
class ProductionConfig(Config):
    DEBUG = False

# Dictionary to map environment names to config objects
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
} 