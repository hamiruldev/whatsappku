from app.services.whatsapp_api import WhatsAppAPI
from flask import current_app

class WhatsAppController:
    @staticmethod
    def post_status(image_path, caption=None):
        """
        Business logic for sending a status update to WhatsApp.
        """
        try:
            response = WhatsAppAPI.send_status(image_path=image_path, caption=caption)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            current_app.logger.error(f"Error posting status: {e}")
            return {"error": str(e)}

    @staticmethod
    def send_message(phone, message, session_name=None):
        """Send a message to a specific phone number"""
        try:
            response = WhatsAppAPI.send_text(
                session=session_name,
                chat_id=phone,
                text=message
            )
            return response.json()
        except Exception as e:
            current_app.logger.error(f"Error sending message: {str(e)}")
            raise e
    
    @staticmethod
    def get_contacts(contact_id=None):
        """
        Business logic for fetching contacts.
        """
        try:
            response = WhatsAppAPI.get_contacts(contact_id)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            current_app.logger.error(f"Error fetching contacts: {e}")
            return {"error": str(e)}

    @staticmethod
    def send_media_message(chat_id, media_type, file_path=None, file_url=None, caption=None):
        """
        Business logic for sending media messages (images, videos, documents).
        """
        try:
            formatted_chat_id = f"{chat_id}@c.us" if "@c.us" not in chat_id else chat_id
            
            if media_type == "image":
                response = WhatsAppAPI.send_image(formatted_chat_id, file_path, file_url, caption)
            elif media_type == "video":
                response = WhatsAppAPI.send_video(formatted_chat_id, file_path, file_url, caption)
            elif media_type == "document":
                response = WhatsAppAPI.send_document(formatted_chat_id, file_path, file_url)
            else:
                return {"error": "Unsupported media type"}
            
            response.raise_for_status()
            return response.json()
        except Exception as e:
            current_app.logger.error(f"Error sending media message: {e}")
            return {"error": str(e)}
