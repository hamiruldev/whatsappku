import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get the base directory of the application
basedir = os.path.abspath(os.path.dirname(__file__))

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
    
    # Path to gold price template image
    PRICE_TEMPLATE_PATH = os.path.join(basedir, 'app', 'static', 'images', 'gold_template.png')
    
    # Chrome driver path for Selenium
    CHROME_DRIVER_PATH = os.environ.get('CHROME_DRIVER_PATH', '/usr/local/bin/chromedriver')
    
    # Static file serving
    STATIC_URL = os.getenv('STATIC_URL')
    
    # Configure static file serving
    STATIC_FOLDER = os.path.join(basedir, 'app', 'static')
    STATIC_URL_PATH = '/static'
    
    # Media URL
    MEDIA_URL = os.getenv('MEDIA_URL')

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