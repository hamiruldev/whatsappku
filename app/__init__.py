from flask import Flask
from flask_cors import CORS
from config import Config
from app.routes import register_routes  # Import the route registration function

app = Flask(__name__)
CORS(app)
app.config.from_object(Config)

# Register routes from routes.py
register_routes(app)
