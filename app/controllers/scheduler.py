from apscheduler.schedulers.background import BackgroundScheduler
from app.services.health_check import HealthCheckService
from app.services.whatsapp_api import WhatsAppAPI
import pytz
from flask import current_app
from datetime import datetime
import uuid
from pytz import timezone
from app.services.image_generator import ImageGenerator

# Create scheduler with proper timezone and settings
scheduler = BackgroundScheduler(
    timezone=timezone('Asia/Kuala_Lumpur'),
    job_defaults={
        'coalesce': False,
        'max_instances': 1,
        'misfire_grace_time': None
    }
)

# Make sure scheduler is started when the application starts
scheduler.start()

def create_message_sender(app):
    def send_message(phone, message, session_name=None, type="text", target="chat"):
        from app.controllers.whatsapp import WhatsAppController
        from app.services.image_generator import ImageGenerator
        
        with app.app_context():
            current_app.logger.info(f"Attempting to send scheduled message at {datetime.now()}")
            current_app.logger.info(f"Session: {session_name}")
            current_app.logger.info(f"Type: {type}")
            current_app.logger.info(f"Target: {target}")
            
            try:
                if type == "story":
                    # Generate and post gold price status
                    result = ImageGenerator.generate_and_post_status(session_name)
                    if result is None:
                        raise Exception("Failed to generate and post status")
                else:
                    # Send regular chat message
                    result = WhatsAppController.send_message(phone, message, session_name)
                
                current_app.logger.info(f"Message sent successfully")
                current_app.logger.info(f"API Response: {result}")
                return result
                
            except Exception as e:
                current_app.logger.error(f"Error sending message: {str(e)}")
                current_app.logger.exception("Full traceback:")
                raise e
    return send_message

def add_scheduled_message(session_name, hour, minute, phone, message, type="text", target="chat"):
    app = current_app._get_current_object()
    message_sender = create_message_sender(app)
    
    job_id = str(uuid.uuid4())
    
    scheduler.add_job(
        message_sender,
        'cron',
        hour=int(hour),
        minute=int(minute),
        id=job_id,
        args=[phone, message],
        kwargs={
            'session_name': session_name,
            'type': type,
            'target': target
        },
        replace_existing=True,
        misfire_grace_time=None
    )
    
    print(f"Added new scheduled message: ID={job_id}, Session={session_name}, Type={type}, Time={hour}:{minute}")
    return job_id

def get_all_scheduled_messages(session_name=None):
    jobs = scheduler.get_jobs()
    scheduled_messages = []
    
    for job in jobs:
        # Skip jobs that don't match the session_name if specified
        job_session = job.kwargs.get('session_name')
        if session_name and job_session != session_name:
            continue
            
        trigger = job.trigger
        
        # Get the hour and minute from the trigger
        hour = trigger.fields[5].expressions[0].first
        minute = trigger.fields[6].expressions[0].first
        
        # Get phone and message from job args
        phone, message = job.args if len(job.args) >= 2 else ('none', 'none')
        
        # Format the date and time
        current_date = datetime.now()
        formatted_time = current_date.strftime(f"%d/%m/%Y {hour:02}:{minute:02}")
        
        scheduled_messages.append({
            'id': job.id,
            'session_name': job_session,
            'enabled': True,
            'hour': hour,
            'minute': minute,
            'time': formatted_time,
            'phone': phone,
            'message': message
        })
    
    return scheduled_messages

def remove_scheduled_message(job_id):
    try:
        scheduler.remove_job(job_id)
        print(f"Removed scheduled message: ID={job_id}")
        return True
    except Exception as e:
        print(f"Error removing job {job_id}: {e}")
        return False

def check_waha_health():
    """Scheduled task to check WAHA API health"""
    app = current_app._get_current_object()
    with app.app_context():
        is_healthy, health_data = HealthCheckService.check_waha_health()
        HealthCheckService.log_health_status(is_healthy, health_data)
        
        if not is_healthy:
            # Optionally send notification or take action when unhealthy
            pass

def check_session_status():
    """Scheduled task to check and manage WAHA session status"""
    app = current_app._get_current_object()
    with app.app_context():
        is_valid, session_data = WhatsAppAPI.check_session_status()
        
        if not is_valid:
            current_app.logger.info("Session is invalid, attempting to restart...")
            success = WhatsAppAPI.restart_session()
            if success:
                current_app.logger.info("Session restarted successfully.")
            else:
                current_app.logger.error("Failed to restart session.")
    timezone = pytz.timezone('Asia/Kuala_Lumpur')
    
    
    print("Scheduler initialized with health and session checks")

# Add to your scheduler initialization
scheduler.add_job(
    ImageGenerator.cleanup_old_images,
    'interval',
    hours=24,
    id='cleanup_gold_price_images'
)