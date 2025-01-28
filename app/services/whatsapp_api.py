import requests
from flask import current_app
import base64

class WhatsAppAPI:
    """
    Service class for making direct API calls to WAHA API
    Documentation: https://waha.devlike.pro/swagger/
    """
    
    @staticmethod
    def _get_base_url():
        return current_app.config['WAHA_API_URL']
    
    @staticmethod
    def _get_session():
        return current_app.config['WAHA_SESSION']
    
    @classmethod
    def send_text(cls, chat_id, text, reply_to=None, link_preview=True):
        """Send a text message to a specific chat"""
        url = f"{cls._get_base_url()}/api/sendText"
        payload = {
            "session": cls._get_session(),
            "chatId": chat_id,
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
    def send_status(cls, image_path=None, image_url=None, caption=None):
        """Send a status/story"""
        url = f"{cls._get_base_url()}/api/sendStatus"
        payload = {
            "session": cls._get_session(),
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