from flask import Flask
from flask_cors import CORS
from config import config
import os

def create_app():
    # Get environment from FLASK_ENV, default to 'development'
    env = os.getenv('FLASK_ENV', 'development')
    
    app = Flask(__name__)
    CORS(app)
    
    # Use the appropriate config class based on environment
    app.config.from_object(config[env])

    with app.app_context():
        # Import and register routes
        from app.routes import register_routes
        register_routes(app)

        # Initialize scheduler
        from app.controllers.scheduler import initialize_scheduler
        initialize_scheduler(app)
        print(f"Scheduler initialized in {env} environment")

    return app