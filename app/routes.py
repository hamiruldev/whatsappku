from flask import render_template, request, jsonify
from app.controllers import whatsapp
from app.controllers.scheduler import toggle_morning_message

def register_routes(app):
    @app.route("/")
    def home():
        return render_template("home.html")

    @app.route("/login")
    def login():
        return render_template("login.html")

    @app.route("/forgot-password")
    def forgot_password():
        return render_template("forgotPassword.html")

    @app.route("/verify-email")
    def verify_email():
        return render_template("verifyEmail.html")

    @app.route("/register")
    def register():
        return render_template("register.html")

    @app.route("/dashboard")
    def dashboard():
        return render_template("dashboard.html")

    @app.route("/api/login", methods=["POST"])
    def api_login():
        data = request.json
        username = data.get("username")
        password = data.get("password")

        # Simulate authentication logic (replace with real logic)
        if username == "admin" and password == "password123":
            return jsonify({"message": "Login successful!"}), 200
        return jsonify({"message": "Invalid username or password."}), 401

    @app.route('/api/contacts', methods=['GET'])
    def fetch_contacts():
        contact_id = request.args.get("contactId")  # Optional parameter
        contacts = whatsapp.WhatsAppController.get_contacts(contact_id=contact_id)
        return jsonify(contacts)

    @app.route('/api/scheduler/morning-message', methods=['GET'])
    def get_scheduler_status():
        from app.controllers.scheduler import get_schedule_time
        return jsonify(get_schedule_time())

    @app.route('/api/scheduler/morning-message', methods=['POST'])
    def update_scheduler_status():
        data = request.json
        enabled = data.get('enabled', False)
        hour = data.get('hour', 9)
        minute = data.get('minute', 0)
        toggle_morning_message(enabled, hour, minute)
        return jsonify({
            "message": "Scheduler updated successfully", 
            "enabled": enabled,
            "hour": hour,
            "minute": minute
        })
