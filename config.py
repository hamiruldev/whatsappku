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
    WAHA_DEFAULT_SESSION = os.getenv('WAHA_DEFAULT_SESSION')
    
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
    
    # NAS Configuration
    USE_NAS_STORAGE = os.getenv('USE_NAS_STORAGE', 'False').lower() == 'true'
    NAS_CONFIG = {
        'server_ip': os.getenv('NAS_SERVER_IP', '192.168.1.100'),
        'port': int(os.getenv('NAS_PORT', '5000')),
        'username': os.getenv('NAS_USERNAME'),
        'password': os.getenv('NAS_PASSWORD'),
        'use_https': os.getenv('NAS_USE_HTTPS', 'False').lower() == 'true',
        'verify_ssl': os.getenv('NAS_VERIFY_SSL', 'False').lower() == 'true',
        'dsm_version': int(os.getenv('NAS_DSM_VERSION', '7'))
    }

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