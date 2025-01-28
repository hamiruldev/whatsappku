from flask import render_template, request, jsonify
from app.controllers import whatsapp
from datetime import datetime

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
        
        from app.controllers.scheduler import toggle_morning_message
        
        data = request.json
        enabled = data.get('enabled', False)
        hour = data.get('hour', 9)
        minute = data.get('minute', 0)
        phone = data.get('phone', 0)
        message = data.get('message', 'None')
        toggle_morning_message(enabled, hour, minute, phone, message)
        return jsonify({
            "enabled": enabled,
            "hour": hour,
            "minute": minute,
            "phone": phone,
            "message": message
        })

    @app.route('/api/scheduled-messages', methods=['GET'])
    def get_scheduled_messages():
        from app.controllers.scheduler import get_all_scheduled_messages
        messages = get_all_scheduled_messages()
        return jsonify(messages)

    @app.route('/api/scheduled-messages', methods=['POST'])
    def create_scheduled_message():
        from app.controllers.scheduler import add_scheduled_message
        data = request.json
        
        job_id = add_scheduled_message(
            hour=data.get('hour'),
            minute=data.get('minute'),
            phone=data.get('phone'),
            message=data.get('message')
        )
        
        return jsonify({
            'id': job_id,
            'status': 'success',
            'message': 'Scheduled message created'
        })

    @app.route('/api/scheduled-messages/<job_id>', methods=['DELETE'])
    def delete_scheduled_message(job_id):
        from app.controllers.scheduler import remove_scheduled_message
        success = remove_scheduled_message(job_id)
        
        if success:
            return jsonify({'status': 'success', 'message': 'Scheduled message removed'})
        return jsonify({'status': 'error', 'message': 'Failed to remove scheduled message'}), 400

    @app.route('/api/waha/health', methods=['GET'])
    def check_waha_health():
        """Endpoint to manually check WAHA API health"""
        from app.services.health_check import HealthCheckService
        
        is_healthy, health_data = HealthCheckService.check_waha_health()
        
        return jsonify({
            'healthy': is_healthy,
            'timestamp': datetime.now().isoformat(),
            'details': health_data
        }), 200 if is_healthy else 503
