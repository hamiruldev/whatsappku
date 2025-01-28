from apscheduler.schedulers.background import BackgroundScheduler
from app.services.health_check import HealthCheckService
import pytz
from flask import current_app
from datetime import datetime
import uuid

scheduler = BackgroundScheduler()

def create_message_sender(app):
    def send_message(phone, message):
        from app.controllers.whatsapp import WhatsAppController
        
        with app.app_context():
            print(f"Executing scheduled message at {datetime.now()}")
            try:
                WhatsAppController.send_message(phone, message)
                print(f"Message sent successfully to {phone}")
            except Exception as e:
                print(f"Error sending message: {e}")
    return send_message

def add_scheduled_message(hour, minute, phone, message):
    app = current_app._get_current_object()
    message_sender = create_message_sender(app)
    
    # Generate a unique ID for this scheduled message
    job_id = str(uuid.uuid4())
    
    # Example of setting a timezone using pytz
    timezone = pytz.timezone('Asia/Kuala_Lumpur')
    
    # Add job with phone and message as arguments
    scheduler.add_job(
        message_sender,
        'cron',
        hour=int(hour),
        minute=int(minute),
        id=job_id,
        timezone=timezone,  # Use the pytz timezone object
        args=[phone, message],
        replace_existing=True,
        misfire_grace_time=None
    )
    
    print(f"Added new scheduled message: ID={job_id}, Time={hour}:{minute}, Phone={phone}")
    return job_id

def get_all_scheduled_messages():
    jobs = scheduler.get_jobs()
    scheduled_messages = []
    
    for job in jobs:
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

def initialize_scheduler(app):
        # Example of setting a timezone using pytz
    timezone = pytz.timezone('Asia/Kuala_Lumpur')
    
    # Add health check job
    scheduler.add_job(
        check_waha_health,
        'interval',
        minutes=5,
        id='waha_health_check',
        timezone=timezone,
        replace_existing=True
    )
    
    scheduler.start()
    print("Scheduler initialized with health check")