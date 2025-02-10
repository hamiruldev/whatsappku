from flask import Flask
from flask_cors import CORS
from config import config
import os
from app.controllers.scheduler import scheduler

def create_app():
    # Get environment from FLASK_ENV, default to 'development'
    env = os.getenv('FLASK_ENV', 'development')
    
    app = Flask(__name__, 
                static_folder='static',
                static_url_path='/static')
    
    # Enable CORS
    CORS(app, resources={
        r"/static/*": {"origins": "*"}
    })
    
    # Use the appropriate config class based on environment
    app.config.from_object(config[env])

    with app.app_context():
        # Import and register routes
        from app.routes import register_routes
        register_routes(app)
        
        # Start the scheduler
        if not scheduler.running:
            scheduler.start()
            
    @app.before_first_request
    def init_scheduler():
        # Ensure scheduler is running
        if not scheduler.running:
            scheduler.start()
            
    return app