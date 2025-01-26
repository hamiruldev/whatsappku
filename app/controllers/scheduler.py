from apscheduler.schedulers.background import BackgroundScheduler
from app.controllers.whatsapp import WhatsAppController
import pytz
from flask import current_app
from datetime import datetime

scheduler = BackgroundScheduler()

def create_message_sender(app):
    def send_morning_message():
        with app.app_context():
            print(f"Executing scheduled message at {datetime.now()}")  # Add debug log
            message = "Good morning! Have a great day ahead! 🌞"
            try:
                WhatsAppController.send_message("60184644305@c.us", message)
                print("Message sent successfully")  # Add debug log
            except Exception as e:
                print(f"Error sending message: {e}")  # Add error log
    return send_morning_message

def initialize_scheduler(app):
    # Create message sender with app context
    morning_message_sender = create_message_sender(app)
    
    # Add the job to the scheduler with timezone
    scheduler.add_job(
        morning_message_sender,
        'cron',
        hour=9,  # Default time
        minute=0,
        id='morning_message',
        timezone=pytz.timezone('Asia/Kuala_Lumpur')
    )
    
    # Start the scheduler
    scheduler.start()

def toggle_morning_message(enabled, hour=9, minute=0):
    job = scheduler.get_job('morning_message')
    if enabled and not job:
        app = current_app._get_current_object()
        morning_message_sender = create_message_sender(app)
        
        print(f"Scheduling new job for {hour}:{minute}")  # Add debug log
        scheduler.add_job(
            morning_message_sender,
            'cron',
            hour=int(hour),
            minute=int(minute),
            id='morning_message',
            timezone=pytz.timezone('Asia/Kuala_Lumpur')
        )
        print(f"Job scheduled successfully")  # Add debug log
    elif not enabled and job:
        print(f"Removing job")  # Add debug log
        scheduler.remove_job('morning_message')

def get_schedule_time():
    job = scheduler.get_job('morning_message')
    if job:
        # Get the cron trigger fields
        trigger = job.trigger
        return {
            'hour': trigger.fields[5].expressions[0].first,  # hour field
            'minute': trigger.fields[6].expressions[0].first,  # minute field
            'enabled': True
        }
    return {'hour': 9, 'minute': 0, 'enabled': False}  # Default values
