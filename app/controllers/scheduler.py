from apscheduler.schedulers.background import BackgroundScheduler
from app.controllers.whatsapp import WhatsAppController
import pytz
from flask import current_app
from datetime import datetime
import uuid

scheduler = BackgroundScheduler()

def create_message_sender(app, phone, message):
    def send_message():
        with app.app_context():
            print(f"Executing scheduled message at {datetime.now()}")
            try:
                WhatsAppController.send_message(f"{phone}@c.us", message)
                print(f"Message sent successfully to {phone}")
            except Exception as e:
                print(f"Error sending message: {e}")
    return send_message

def add_scheduled_message(hour, minute, phone, message):
    app = current_app._get_current_object()
    message_sender = create_message_sender(app, phone, message)
    
    # Generate a unique ID for this scheduled message
    job_id = str(uuid.uuid4())
    
    scheduler.add_job(
        message_sender,
        'cron',
        hour=int(hour),
        minute=int(minute),
        id=job_id,
        timezone=pytz.timezone('Asia/Kuala_Lumpur')
    )
    
    print(f"Added new scheduled message: ID={job_id}, Time={hour}:{minute}, Phone={phone}")
    return job_id

def remove_scheduled_message(job_id):
    try:
        scheduler.remove_job(job_id)
        print(f"Removed scheduled message: ID={job_id}")
        return True
    except Exception as e:
        print(f"Error removing job {job_id}: {e}")
        return False

def get_all_scheduled_messages():
    jobs = scheduler.get_jobs()
    scheduled_messages = []
    
    for job in jobs:
        trigger = job.trigger

        # Get the hour and minute from the trigger
        hour = trigger.fields[5].expressions[0].first
        minute = trigger.fields[6].expressions[0].first

        # Assuming the trigger has a date field (e.g., trigger.fields[4])
        current_date = datetime.now()

        # Format the date and time in "dd/MM/yyyy hh:mm"
        formatted_time = current_date.strftime(f"%d/%m/%Y {hour:02}:{minute:02}")

        # Append the message with the formatted time
        scheduled_messages.append({
            'id': job.id,
            'enabled': True,
            'hour': hour,
            'minute': minute,
            'time': formatted_time,
            'phone': 'none',
            'message': 'none'
        })
        
        return scheduled_messages

def initialize_scheduler(app):
    scheduler.start()
    print("Scheduler initialized")