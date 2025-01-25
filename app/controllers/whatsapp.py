import requests

class WhatsAppController:
    @staticmethod
    def post_status(image_path):
        from app import app  # Mo
        with open(image_path, 'rb') as image_file:
            encoded_image = base64.b64encode(image_file.read()).decode('utf-8')
        
        payload = {
            "session": app.config['WAHA_SESSION'],
            "file": {
                "mimetype": "image/jpeg",
                "data": encoded_image
            }
        }
        
        response = requests.post(
            f"{app.config['WAHA_API_URL']}/sendStatus",
            json=payload
        )
        return response.json()

    @staticmethod
    def send_message(chat_id, message):
        from app import app  # Mo
        payload = {
            "session": app.config['WAHA_SESSION'],
            "chatId": chat_id,
            "text": message
        }
        
        response = requests.post(
            f"{app.config['WAHA_API_URL']}/sendText",
            json=payload
        )
        return response.json()
    
    @staticmethod
    def get_contacts(contact_id=None):
        from app import app  # Mo
        
        """
        Fetches the list of all contacts or details of a specific contact from WAHA API.
        :param contact_id: Optional contact ID to fetch specific contact details.
        :return: JSON response containing contacts or an error message.
        """
        try:
            if contact_id != 'all':
                # Endpoint for a specific contact
                url = f"{app.config['WAHA_API_URL']}/api/contacts"
                params = {
                    "contactId": contact_id,
                    "session": app.config['WAHA_SESSION']
                }
            else:
                # Endpoint for all contacts
                url = f"{app.config['WAHA_API_URL']}/api/contacts/all"
                params = {
                    "session": app.config['WAHA_SESSION']
                }
            
            # Make the GET request
            response = requests.get(url, params=params)
            response.raise_for_status()
            
            # Return the JSON response
            return response.json()
        except requests.exceptions.RequestException as e:
            app.logger.error(f"Error fetching contacts: {e}")
            return {"error": str(e)}
