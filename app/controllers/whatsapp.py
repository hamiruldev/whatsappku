import requests
from flask import current_app
import base64

class WhatsAppController:
    @staticmethod
    def post_status(image_path):
        """
        Sends a status update to WhatsApp.
        :param image_path: Path to the image file.
        :return: JSON response from WAHA API.
        """
        with open(image_path, 'rb') as image_file:
            encoded_image = base64.b64encode(image_file.read()).decode('utf-8')
        
        payload = {
            "session": current_app.config['WAHA_SESSION'],
            "file": {
                "mimetype": "image/jpeg",
                "data": encoded_image
            }
        }
        
        response = requests.post(
            f"{current_app.config['WAHA_API_URL']}/sendStatus",
            json=payload
        )
        return response.json()

    @staticmethod
    def send_message(chat_id, message):
        """
        Sends a message to a specific chat ID.
        :param chat_id: WhatsApp chat ID.
        :param message: Message text to send.
        :return: JSON response from WAHA API.
        """
        payload = {
            "session": current_app.config['WAHA_SESSION'],
            "chatId": chat_id,
            "reply_to": None,
            "text": message,
            "linkPreview": True,
        }
        
        response = requests.post(
            f"{current_app.config['WAHA_API_URL']}/api/sendText",
            json=payload
        )
        return response.json()
    
    @staticmethod
    def get_contacts(contact_id=None):
        """
        Fetches the list of all contacts or details of a specific contact from WAHA API.
        :param contact_id: Optional contact ID to fetch specific contact details.
        :return: JSON response containing contacts or an error message.
        """
        try:
            if contact_id != 'all':
                # Endpoint for a specific contact
                url = f"{current_app.config['WAHA_API_URL']}/api/contacts"
                params = {
                    "contactId": contact_id,
                    "session": current_app.config['WAHA_SESSION']
                }
            else:
                # Endpoint for all contacts
                url = f"{current_app.config['WAHA_API_URL']}/api/contacts/all"
                params = {
                    "session": current_app.config['WAHA_SESSION']
                }
            
            # Make the GET request
            response = requests.get(url, params=params)
            response.raise_for_status()
            
            # Return the JSON response
            return response.json()
        except requests.exceptions.RequestException as e:
            current_app.logger.error(f"Error fetching contacts: {e}")
            return {"error": str(e)}
