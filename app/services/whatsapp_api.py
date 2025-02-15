from datetime import datetime
import requests
from flask import current_app, request
import base64
import os

class WhatsAppAPI:
    """
    Service class for making direct API calls to WAHA API
    Documentation: https://waha.devlike.pro/swagger/
    """
    
    @staticmethod
    def _get_base_url():
        return current_app.config['WAHA_API_URL']
    
    @staticmethod
    def _get_media_url():
        return current_app.config['MEDIA_URL']
    
    @staticmethod
    def _get_session():
        return current_app.config['WAHA_SESSION']
    
    @classmethod
    def send_text(cls, session, chat_id, text, reply_to=None, link_preview=True):
        """Send a text message to a specific chat"""
        url = f"{cls._get_base_url()}/api/sendText"
        payload = {
            "session": session,
            "chatId": f"{chat_id}@c.us",
            "text": text,
            "reply_to": reply_to,
            "linkPreview": link_preview
        }
        return requests.post(url, json=payload)

    @classmethod
    def send_image(cls, chat_id, image_path=None, image_url=None, caption=None):
        """Send an image message"""
        url = f"{cls._get_base_url()}/api/sendImage"
        payload = {
            "session": cls._get_session(),
            "chatId": chat_id,
            "caption": caption
        }
        
        if image_path:
            with open(image_path, 'rb') as image_file:
                payload["file"] = {
                    "data": base64.b64encode(image_file.read()).decode('utf-8')
                }
        elif image_url:
            payload["file"] = {"url": image_url}
            
        return requests.post(url, json=payload)

    @classmethod
    def send_video(cls, chat_id, video_path=None, video_url=None, caption=None):
        """Send a video message"""
        url = f"{cls._get_base_url()}/api/sendVideo"
        payload = {
            "session": cls._get_session(),
            "chatId": chat_id,
            "caption": caption
        }
        
        if video_path:
            with open(video_path, 'rb') as video_file:
                payload["file"] = {
                    "data": base64.b64encode(video_file.read()).decode('utf-8')
                }
        elif video_url:
            payload["file"] = {"url": video_url}
            
        return requests.post(url, json=payload)

    @classmethod
    def send_audio(cls, chat_id, audio_path=None, audio_url=None):
        """Send an audio message"""
        url = f"{cls._get_base_url()}/api/sendAudio"
        payload = {
            "session": cls._get_session(),
            "chatId": chat_id
        }
        
        if audio_path:
            with open(audio_path, 'rb') as audio_file:
                payload["file"] = {
                    "data": base64.b64encode(audio_file.read()).decode('utf-8')
                }
        elif audio_url:
            payload["file"] = {"url": audio_url}
            
        return requests.post(url, json=payload)

    @classmethod
    def send_document(cls, chat_id, document_path=None, document_url=None, filename=None):
        """Send a document"""
        url = f"{cls._get_base_url()}/api/sendDocument"
        payload = {
            "session": cls._get_session(),
            "chatId": chat_id,
            "filename": filename
        }
        
        if document_path:
            with open(document_path, 'rb') as doc_file:
                payload["file"] = {
                    "data": base64.b64encode(doc_file.read()).decode('utf-8')
                }
        elif document_url:
            payload["file"] = {"url": document_url}
            
        return requests.post(url, json=payload)

    @classmethod
    def send_location(cls, chat_id, latitude, longitude, title=None, address=None):
        """Send a location"""
        url = f"{cls._get_base_url()}/api/sendLocation"
        payload = {
            "session": cls._get_session(),
            "chatId": chat_id,
            "latitude": latitude,
            "longitude": longitude,
            "title": title,
            "address": address
        }
        return requests.post(url, json=payload)

    @classmethod
    def send_status(cls, session, image_path, caption=""):
        """Send an image to WhatsApp status"""
        try:
            # Ensure the file exists
            if not os.path.exists(image_path):
                raise FileNotFoundError(f"Image file not found: {image_path}")
            
            # Read the image file in binary mode
            with open(image_path, 'rb') as image_file:
                files = {
                    'file': ('status.png', image_file, 'image/png')
                }
            
            data = {
                'caption': caption
            }
            
            url = f"{current_app.config['WAHA_API_URL']}/api/sendStatus"
            headers = {
                'session': session
            }
            
            response = requests.post(
                url,
                headers=headers,
                data=data,
                files=files
            )
            
            response.raise_for_status()
            return response.json()
            
        except Exception as e:
            current_app.logger.error(f"Error sending status: {str(e)}")
            raise

    @classmethod
    def get_contacts(cls, contact_id=None):
        """Get all contacts or a specific contact"""
        if contact_id and contact_id != 'all':
            url = f"{cls._get_base_url()}/api/contacts"
            params = {
                "contactId": contact_id,
                "session": cls._get_session()
            }
        else:
            url = f"{cls._get_base_url()}/api/contacts/all"
            params = {
                "session": cls._get_session()
            }
        
        return requests.get(url, params=params)

    @classmethod
    def get_chats(cls):
        """Get all chats"""
        url = f"{cls._get_base_url()}/api/chats"
        params = {
            "session": cls._get_session()
        }
        return requests.get(url, params=params)

    @classmethod
    def get_messages(cls, chat_id, limit=100):
        """Get messages from a specific chat"""
        url = f"{cls._get_base_url()}/api/messages"
        params = {
            "session": cls._get_session(),
            "chatId": chat_id,
            "limit": limit
        }
        return requests.get(url, params=params) 
    
    @staticmethod
    def check_sessions_status():
        """
        Check the current session status.
        Returns: tuple (bool, dict) - (is_valid, session_data)
        """
        try:
            url = f"{current_app.config['WAHA_API_URL']}/api/sessions?all=true"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                session_data = response.json()
                
                return session_data
            
            current_app.logger.error(f"Session status check failed with status code: {response.status_code}")
            return False, {'error': f'Status check failed with status {response.status_code}'}
            
        except Exception as e:
            current_app.logger.error(f"Error checking session status: {str(e)}")
            return False, {'error': str(e)}
    @staticmethod
    def check_session_status(session_name):
        """
        Check the current session status.
        Returns: tuple (dict) - (session_data)
        """
        try:
            url = f"{current_app.config['WAHA_API_URL']}/api/sessions/{session_name}"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                session_data = response.json()
                return session_data
            
            current_app.logger.error(f"Session status check failed with status code: {response.status_code}")
            return False, {'error': f'Status check failed with status {response.status_code}'}
            
        except Exception as e:
            current_app.logger.error(f"Error checking session status: {str(e)}")
            return False, {'error': str(e)}

    @staticmethod
    def check_session_status_me():
        """
        Check the current session status.
        Returns: tuple (bool, dict) - (is_valid, session_data)
        """
        try:
            url = f"{current_app.config['WAHA_API_URL']}/api/sessions/session/me"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                session_data = response.json()
                expected_id = "60184644305@c.us"
                
                is_valid = session_data.get('id') == expected_id
                if not is_valid:
                    current_app.logger.warning(f"Session ID mismatch: {session_data.get('id')}")
                
                return is_valid, session_data
            
            current_app.logger.error(f"Session status check failed with status code: {response.status_code}")
            return False, {'error': f'Status check failed with status {response.status_code}'}
            
        except Exception as e:
            current_app.logger.error(f"Error checking session status: {str(e)}")
            return False, {'error': str(e)}

    @staticmethod
    def create_session(data):
        """Create a new session"""
        try:
            url = f"{current_app.config['WAHA_API_URL']}/api/sessions"
            payload = {
                "name": data.get('name'),
                "start": data.get('start'),
            }
            
            response = requests.post(url, json=payload, timeout=30)
            
            if response.status_code == 201:
                return True, response.json()
            else:
                current_app.logger.error(f"Failed to create session: {response.text}")
                return False, {'error': f'Failed to create session: {response.text}'}
            
        except Exception as e:
            current_app.logger.error(f"Error creating session: {str(e)}")
            return False, {'error': str(e)}

    @staticmethod
    def delete_session(session_name):
        """Delete a session"""
        try:
            # First stop the session
            stop_url = f"{current_app.config['WAHA_API_URL']}/api/sessions/{session_name}/stop"
            stop_response = requests.post(stop_url, timeout=10)
            
            if stop_response.status_code != 200:
                current_app.logger.warning(f"Failed to stop session before deletion: {stop_response.text}")
            
            # Then delete the session
            delete_url = f"{current_app.config['WAHA_API_URL']}/api/sessions/{session_name}"
            delete_response = requests.delete(delete_url, timeout=10)
            
            # Handle empty response
            if delete_response.status_code == 200:
                try:
                    return True, delete_response.json()
                except ValueError:  # JSON decoding failed
                    return True, {'message': 'Session deleted successfully'}
            else:
                current_app.logger.error(f"Failed to delete session: {delete_response.text}")
                return False, {'error': f'Failed to delete session: {delete_response.text}'}
            
        except Exception as e:
            current_app.logger.error(f"Error deleting session: {str(e)}")
            return False, {'error': str(e)}

    @staticmethod
    def start_session(session_name):
        """Start the session"""
        try:
            url = f"{current_app.config['WAHA_API_URL']}/api/sessions/{session_name}/start"
            response = requests.post(url, timeout=10)
            return response.status == "SCAN_QR_CODE", response.json()
        except Exception as e:
            return False, {'error': str(e)}

    @staticmethod
    def stop_session(session_name):
        """Stop the session"""
        try:
            url = f"{current_app.config['WAHA_API_URL']}/api/sessions/{session_name}/stop"
            response = requests.post(url, timeout=10)
            return response.status_code == 200, response.json()
        except Exception as e:
            return False, {'error': str(e)}

    @staticmethod
    def restart_session(session_name):
        """Restart the session using WAHA API"""
        try:
            url = f"{current_app.config['WAHA_API_URL']}/api/sessions/{session_name}/restart"
            response = requests.post(url, timeout=90)

            # Handle HTTP errors
            if response.status_code != 200:
                return False, {'error': f"Failed to restart session {session_name}: {response.text}"}

            return True, response.json()
        except requests.exceptions.RequestException as e:
            return False, {'error': f"Request error: {str(e)}"}

    @staticmethod
    def get_screenshot(session_name):
        """Get a screenshot of the current session"""
        url = f"{current_app.config['WAHA_API_URL']}/api/screenshot?session={session_name}"
        response = requests.get(url, timeout=10)
        return response.status_code == 200, response.json()

    @staticmethod
    def get_qrcode(session_name):
        """Get a qrcpde of the current session"""
        url = f"{current_app.config['WAHA_API_URL']}/api/{session_name}/auth/qr?format=image"
        response = requests.get(url, timeout=10)
        return response.status_code == 200, response.json()
    
    @staticmethod
    def check_waha_health():
        """
        Check WAHA API health status
        Returns: tuple (bool, dict) - (is_healthy, health_data)
        """
        try:
            url = f"{current_app.config['WAHA_API_URL']}/health"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                health_data = response.json()
                
                # Check if all services are up
                all_services_up = (
                    health_data.get('status') == 'ok' and
                    all(info.get('status') == 'up' 
                        for info in health_data.get('info', {}).values())
                )
                
                if not all_services_up:
                    current_app.logger.warning(f"WAHA API services not all up: {health_data}")
                
                return all_services_up, health_data
            
            current_app.logger.error(f"WAHA API health check failed with status code: {response.status_code}")
            return False, {'error': f'Health check failed with status {response.status_code}'}
            
        except Exception as e:
            current_app.logger.error(f"Error checking WAHA API health: {str(e)}")
            return False, {'error': str(e)}

    @staticmethod
    def log_health_status(is_healthy, health_data):
        """Log the health check results"""
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        status = "HEALTHY" if is_healthy else "UNHEALTHY"
        
        current_app.logger.info(f"[{timestamp}] WAHA API Status: {status}")
        if not is_healthy:
            current_app.logger.error(f"Health check details: {health_data}") 