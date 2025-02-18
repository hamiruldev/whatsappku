from apscheduler.schedulers.background import BackgroundScheduler
from app.services.whatsapp_api import WhatsAppAPI
import pytz
from flask import current_app
from datetime import datetime
import uuid
from pytz import timezone
from app.services.image_generator import ImageGenerator
from apscheduler.triggers.cron import CronTrigger
import re

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
    def send_message(phone, message, session_name=None, type="text", target="Chat"):
        from app.controllers.whatsapp import WhatsAppController
        from app.services.image_generator import ImageGenerator
        
        with app.app_context():
            current_app.logger.info(f"Attempting to send scheduled message at {datetime.now()}")
            current_app.logger.info(f"Session: {session_name}")
            current_app.logger.info(f"Type: {type}")
            current_app.logger.info(f"Target: {target}")
            
            try:
                if target == "Status":
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

def add_scheduled_message(session_id, hour, minute, phone, message, type="text", target="Chat", start_date=None, recurrence=None):
    """Add a new scheduled message with optional recurrence"""
    try:
        app = current_app._get_current_object()
        message_sender = create_message_sender(app)
        
        job_id = str(uuid.uuid4())
        
        # Convert start_date from ISO string to datetime if provided
        if start_date:
            try:
                # Parse ISO format and convert to local timezone
                start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00')).astimezone(pytz.timezone('Asia/Kuala_Lumpur'))
            except Exception as e:
                current_app.logger.error(f"Error parsing start_date: {str(e)}")
                start_date = None
        
        # Create the job trigger based on recurrence
        if recurrence:
            try:
                # Parse the recurrence rule and create appropriate trigger
                trigger = create_trigger_from_recurrence(recurrence, hour, minute, start_date)
                scheduler.add_job(
                    message_sender,
                    trigger=trigger,
                    id=job_id,
                    args=[phone, message],
                    kwargs={
                        'session_id': session_id,
                        'type': type,
                        'target': target
                    },
                    replace_existing=True,
                    misfire_grace_time=None
                )
            except Exception as e:
                current_app.logger.error(f"Error creating recurring job: {str(e)}")
                raise
        else:
            # Use simple cron trigger
            trigger_kwargs = {
                'hour': int(hour),
                'minute': int(minute)
            }
            
            if start_date:
                trigger_kwargs['start_date'] = start_date
            
            scheduler.add_job(
                message_sender,
                'cron',
                id=job_id,
                args=[phone, message],
                kwargs={
                    'session_name': session_name,
                    'type': type,
                    'target': target
                },
                replace_existing=True,
                misfire_grace_time=None,
                **trigger_kwargs
            )
        
        current_app.logger.info(
            f"Added new scheduled message: ID={job_id}, Session={session_name}, "
            f"Target={target}, Type={type}, Time={hour}:{minute}, Start={start_date}, Recurrence={recurrence}"
        )
        return job_id
        
    except Exception as e:
        current_app.logger.error(f"Error in add_scheduled_message: {str(e)}")
        raise Exception(f"Failed to schedule message: {str(e)}")

def create_trigger_from_recurrence(recurrence_rule, hour, minute, start_date=None):
    """Convert recurrence rule to APScheduler trigger"""
    try:
        trigger_kwargs = {
            'hour': int(hour),
            'minute': int(minute)
        }
        
        if start_date:
            trigger_kwargs['start_date'] = start_date
            
        # If no recurrence rule, just return a basic trigger
        if not recurrence_rule:
            return CronTrigger(**trigger_kwargs)
            
        # Handle different frequencies
        if 'FREQ=DAILY' in recurrence_rule:
            # For daily, we just need hour and minute which are already set
            pass
            
        elif 'FREQ=WEEKLY' in recurrence_rule:
            # Extract day of week
            days = re.search(r'BYDAY=([^;]+)', recurrence_rule)
            if days:
                # Convert from RRULE day format (MO,TU,etc) to cron format (0-6)
                day_map = {'MO': 0, 'TU': 1, 'WE': 2, 'TH': 3, 'FR': 4, 'SA': 5, 'SU': 6}
                day_list = days.group(1).split(',')
                cron_days = [str(day_map[day]) for day in day_list]
                trigger_kwargs['day_of_week'] = ','.join(cron_days)
                
        elif 'FREQ=MONTHLY' in recurrence_rule:
            # Extract day of month
            day = re.search(r'BYMONTHDAY=([^;]+)', recurrence_rule)
            if day:
                trigger_kwargs['day'] = day.group(1)
        
        # Create and return the trigger
        return CronTrigger(**trigger_kwargs)
        
    except Exception as e:
        current_app.logger.error(f"Error creating trigger from recurrence: {str(e)}")
        current_app.logger.error(f"Recurrence rule was: {recurrence_rule}")
        current_app.logger.error(f"Trigger kwargs: {trigger_kwargs}")
        raise Exception(f"Invalid recurrence pattern: {str(e)}")

def get_all_scheduled_messages(session_id=None):
    """Get all scheduled messages, optionally filtered by session_id"""
    jobs = scheduler.get_jobs()
    scheduled_messages = []
    
    for job in jobs:
        # Skip jobs that don't match the session_id if specified
        job_session = job.kwargs.get('session_id')  # Changed from session_name to session_id
        if session_id and job_session != session_id:
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
            'session_id': job_session,  # Changed from session_name to session_id
            'enabled': True,
            'hour': hour,
            'minute': minute,
            'time': formatted_time,
            'phone': phone,
            'message': message,
            'type': job.kwargs.get('type', 'text'),
            'target': job.kwargs.get('target', 'Chat'),
            'recurrence': str(job.trigger) if 'cron' in str(job.trigger).lower() else 'none'
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
        is_healthy, health_data = WhatsAppAPI.check_waha_health()
        WhatsAppAPI.log_health_status(is_healthy, health_data)
        
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

def backup_jobs_to_pocketbase():
    """Backup all scheduler jobs to PocketBase"""
    from app.services.pocketbase import create_record, update_record, get_first_record
    
    try:
        jobs = scheduler.get_jobs()
        backed_up_count = 0
        
        for job in jobs:
            # Extract job details
            trigger = job.trigger
            hour = trigger.fields[5].expressions[0].first
            minute = trigger.fields[6].expressions[0].first
            phone, message = job.args if len(job.args) >= 2 else ('none', 'none')
            
            # Create job data
            job_data = {
                'job_id': job.id,
                'session': job.kwargs.get('session_id'),  # Changed from session_name to session_id
                'platform': 'Whatsapp',
                'target': job.kwargs.get('target', 'Chat'),
                'phone': phone,
                'message': message,
                'type': job.kwargs.get('type', 'text'),
                'start_date': job.trigger.start_date.isoformat() if hasattr(job.trigger, 'start_date') else None,
                'recurrence': str(job.trigger) if 'cron' in str(job.trigger).lower() else 'none',
                'status': 'pending',
                'enabled': True,
                'last_run': None,
                'next_run': job.next_run_time.isoformat() if job.next_run_time else None,
                'hour': hour,
                'minute': minute
            }
            
            try:
                # Try to find existing job
                existing_job = get_first_record('whatsappku_scheduled_messages', f'job_id = "{job.id}"')
                if existing_job:
                    # Update existing job
                    update_record('whatsappku_scheduled_messages', existing_job.id, job_data)
                else:
                    # Create new job
                    create_record('whatsappku_scheduled_messages', job_data)
                backed_up_count += 1
                
            except Exception as e:
                current_app.logger.error(f"Error backing up job {job.id}: {str(e)}")
                
        current_app.logger.info(f"Successfully backed up {backed_up_count} jobs to PocketBase")
        return True
    except Exception as e:
        current_app.logger.error(f"Error backing up jobs to PocketBase: {str(e)}")
        return False

def restore_jobs_from_pocketbase():
    """Restore scheduler jobs from PocketBase backup"""
    from app.services.pocketbase import list_records
    
    try:
        # Get all backed up jobs
        result = list_records('whatsappku_scheduled_messages', filter_str='enabled = true')
        restored_count = 0
        
        for job in result.items:
            if not job.enabled:
                continue
                
            try:
                # Convert recurrence string back to proper format
                recurrence = None
                if job.recurrence and job.recurrence != 'none':
                    recurrence = job.recurrence
                
                # Add job back to scheduler
                add_scheduled_message(
                    session_id=job.session,  # Changed from session_name to session_id
                    hour=job.hour,
                    minute=job.minute,
                    phone=job.phone,
                    message=job.message,
                    type=job.type,
                    target=job.target,
                    start_date=job.start_date,
                    recurrence=recurrence
                )
                restored_count += 1
                
            except Exception as e:
                current_app.logger.error(f"Error restoring job {job.job_id}: {str(e)}")
                
        current_app.logger.info(f"Successfully restored {restored_count} jobs from PocketBase")
        return True
    except Exception as e:
        current_app.logger.error(f"Error restoring jobs from PocketBase: {str(e)}")
        return False

# Add backup/restore endpoints to routes.py
def init_scheduler_with_backup():
    """Initialize scheduler and restore jobs from backup"""
    if not scheduler.running:
        scheduler.start()
        restore_jobs_from_pocketbase()
        
    # Schedule periodic backup
    scheduler.add_job(
        backup_jobs_to_pocketbase,
        'interval',
        hours=1,
        id='backup_scheduler_jobs',
        replace_existing=True
    )

# Add to your scheduler initialization
# scheduler.add_job(
#     ImageGenerator.cleanup_old_images,
#     'interval',
#     hours=24,
#     id='cleanup_gold_price_images'
# )