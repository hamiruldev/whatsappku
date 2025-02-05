from app import create_app
import os

# Create the Flask application instance
app = create_app()
application = app  # Add this line for Gunicorn

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8001))
    app.run(host="0.0.0.0", port=port)