from flask import current_app, render_template, request, jsonify
from app.controllers import scheduler, whatsapp
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler

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

    @app.route('/api/scheduled-messages', methods=['GET', 'POST', 'DELETE'])
    def manage_scheduled_messages():
        from app.controllers.scheduler import add_scheduled_message, get_all_scheduled_messages, remove_scheduled_message
        
        if request.method == 'GET':
            session_name = request.args.get('session')
            messages = get_all_scheduled_messages(session_name)
            return jsonify(messages)
        
        elif request.method == 'POST':
            data = request.json
            try:
                job_id = add_scheduled_message(
                    session_name=data.get('session'),
                    hour=data.get('hour'),
                    minute=data.get('minute'),
                    phone=data.get('phone'),
                    message=data.get('message'),
                    message_type=data.get('message_type')
                )
                
                return jsonify({
                    'id': job_id,
                    'status': 'success',
                    'message': 'Scheduled message created'
                })
            except Exception as e:
                return jsonify({
                    'status': 'error',
                    'message': str(e)
                }), 400
            
        elif request.method == 'DELETE':
            job_id = request.json.get('id')
            if not job_id:
                return jsonify({
                    'status': 'error',
                    'message': 'Job ID is required'
                }), 400
            
            success = remove_scheduled_message(job_id)
            if success:
                return jsonify({
                    'status': 'success',
                    'message': 'Scheduled message removed'
                })
            return jsonify({
                'status': 'error',
                'message': 'Failed to remove scheduled message'
            }), 400

    @app.route('/api/scheduled-messages/session/<session_name>', methods=['GET'])
    def get_session_messages(session_name):
        """Get all scheduled messages for a specific session"""
        from app.controllers.scheduler import get_all_scheduled_messages
        
        try:
            messages = get_all_scheduled_messages(session_name)
            return jsonify({
                'status': 'success',
                'data': messages
            })
        except Exception as e:
            return jsonify({
                'status': 'error',
                'message': str(e)
            }), 400

    @app.route('/api/scheduled-messages/bulk', methods=['POST'])
    def bulk_schedule_messages():
        """Create multiple scheduled messages at once"""
        from app.controllers.scheduler import add_scheduled_message
        
        data = request.json
        session_name = data.get('session')
        messages = data.get('messages', [])
        
        results = []
        for msg in messages:
            try:
                job_id = add_scheduled_message(
                    session_name=session_name,
                    hour=msg.get('hour'),
                    minute=msg.get('minute'),
                    phone=msg.get('phone'),
                    message=msg.get('message')
                )
                results.append({
                    'status': 'success',
                    'id': job_id,
                    'message': msg
                })
            except Exception as e:
                results.append({
                    'status': 'error',
                    'message': str(e),
                    'data': msg
                })
        
        return jsonify({
            'status': 'success',
            'results': results
        })

    @app.route('/api/scheduled-messages/session/<session_name>/clear', methods=['POST'])
    def clear_session_messages(session_name):
        """Remove all scheduled messages for a specific session"""
        from app.controllers.scheduler import get_all_scheduled_messages, remove_scheduled_message
        
        try:
            messages = get_all_scheduled_messages(session_name)
            removed = 0
            failed = 0
            
            for msg in messages:
                if remove_scheduled_message(msg['id']):
                    removed += 1
                else:
                    failed += 1
            
            return jsonify({
                'status': 'success',
                'removed': removed,
                'failed': failed
            })
        except Exception as e:
            return jsonify({
                'status': 'error',
                'message': str(e)
            }), 400

    @app.route('/api/health', methods=['GET'])
    def check_waha_health():
        """Endpoint to manually check WAHA API health"""
        from app.services.health_check import HealthCheckService
        
        is_healthy, health_data = HealthCheckService.check_waha_health()
        
        return jsonify({
            'healthy': is_healthy,
            'timestamp': datetime.now().isoformat(),
            'details': health_data
        }), 200 if is_healthy else 503
        
    @app.route('/api/sessions', methods=['GET'])
    def check_sessions_status():
        """Endpoint to manually check WAHA session status"""
        from app.services.whatsapp_api import WhatsAppAPI
        
        session_data = WhatsAppAPI.check_sessions_status()
        
        return jsonify({
            'timestamp': datetime.now().isoformat(),
            'details': session_data
        }), 200

    @app.route('/api/session/<session_name>', methods=['GET'])
    def check_session_status(session_name):
        """Endpoint to manually check WAHA session status"""
        from app.services.whatsapp_api import WhatsAppAPI
        
        session_data = WhatsAppAPI.check_session_status(session_name)
        
        return jsonify({
            'timestamp': datetime.now().isoformat(),
            'details': session_data
        }), 200
        
    @app.route('/api/session/me', methods=['GET'])
    def check_session_status_me():
        """Endpoint to manually check WAHA session status"""
        from app.services.whatsapp_api import WhatsAppAPI
        
        is_valid, session_data = WhatsAppAPI.check_session_status_me()
        
        return jsonify({
            'valid': is_valid,
            'timestamp': datetime.now().isoformat(),
            'details': session_data
        }), 200 if is_valid else 503

    @app.route('/api/session/create', methods=['POST'])
    def create_session():
        """Create a new session"""
        from app.services.whatsapp_api import WhatsAppAPI
        data = request.json
        success, result = WhatsAppAPI.create_session(data)
        return jsonify(result), 201 if success else 400

    @app.route('/api/session/delete', methods=['POST'])
    def delete_session():
        """Delete a session"""
        from app.services.whatsapp_api import WhatsAppAPI
        data = request.json
        success, result = WhatsAppAPI.delete_session(data.get('name'))
        return jsonify(result), 200 if success else 400

    @app.route('/api/session/start', methods=['POST'])
    def start_session():
        """Start the session"""
        from app.services.whatsapp_api import WhatsAppAPI
        data = request.json
        success, result = WhatsAppAPI.start_session(data.get('name'))
        return jsonify(result), 200 if success else 400

    @app.route('/api/session/stop', methods=['POST'])
    def stop_session():
        """Stop the session"""
        from app.services.whatsapp_api import WhatsAppAPI
        data = request.json
        success, result = WhatsAppAPI.stop_session(data.get('name'))
        return jsonify(result), 200 if success else 400

    @app.route('/api/session/restart', methods=['POST'])
    def restart_session():
        """Restart the session"""
        from app.services.whatsapp_api import WhatsAppAPI
        
        data = request.get_json()  # Use `get_json()` to handle missing JSON body safely
        if not data or 'name' not in data:
            return jsonify({'error': 'Session name is required'}), 400

        session_name = data['name']
        success, result = WhatsAppAPI.restart_session(session_name)

        return jsonify(result), 200 if success else 400

    @app.route('/api/session/screenshot/<session_name>', methods=['GET'])
    def get_screenshot(session_name):
        """Get session screenshot"""
        from app.services.whatsapp_api import WhatsAppAPI

        success, result = WhatsAppAPI.get_screenshot(session_name)
        return jsonify(result), 200 if success else 400

    @app.route('/api/session/auth/qr', methods=['POST'])
    def get_qrcode():
        """Get qrcode """
        from app.services.whatsapp_api import WhatsAppAPI
    
        data = request.get_json()  # Use `get_json()` to handle missing JSON body safely
        if not data or 'name' not in data:
            return jsonify({'error': 'Session name is required'}), 400

        session_name = data['name']

        success, result = WhatsAppAPI.get_qrcode(session_name)
        return jsonify(result), 200 if success else 400

    @app.route('/webhook', methods=['POST'])
    def webhook_handler():
        """Handle incoming webhooks from WAHA server"""
        try:
            data = request.json
            
            # Log the incoming webhook
            current_app.logger.info(f"Received webhook: {data.get('event')}")
            current_app.logger.debug(f"Webhook payload: {data}")

            # Handle session.status events
            if data.get('event') == 'session.status':
                return handle_session_status(data)
            
            return jsonify({'status': 'success', 'message': 'Event ignored'}), 200
            
        except Exception as e:
            current_app.logger.error(f"Error processing webhook: {str(e)}")
            return jsonify({'status': 'error', 'message': str(e)}), 500

    def handle_session_status(data):
        """Handle session.status events"""
        try:
            session_name = data.get('session')
            payload = data.get('payload', {})
            status = payload.get('status')
            
            current_app.logger.info(f"Session {session_name} status changed to {status}")
            
            # Emit status to all connected clients via WebSocket
            emit_session_status(session_name, status)
            
            return jsonify({
                'status': 'success',
                'session': session_name,
                'new_status': status
            }), 200
            
        except Exception as e:
            current_app.logger.error(f"Error handling session status: {str(e)}")
            return jsonify({'status': 'error', 'message': str(e)}), 500

    @app.route('/api/scheduler/jobs', methods=['GET'])
    def get_scheduler_jobs():
        jobs = []
        for job in scheduler.get_jobs():
            jobs.append({
                'id': job.id,
                'next_run_time': str(job.next_run_time),
                'trigger': str(job.trigger),
                'args': job.args
            })
        return jsonify(jobs)

    @app.route('/api/message/send', methods=['POST'])
    def send_message():
        from app.services.whatsapp_api import WhatsAppAPI
        data = request.json
        
        try:
            response = WhatsAppAPI.send_text(
                chat_id=data['phone'],
                text=data['message'],
                session=data['session']
            )
            return jsonify({'success': True, 'message': 'Message sent successfully'}), 200
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 400