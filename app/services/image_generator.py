import requests
from bs4 import BeautifulSoup
from PIL import Image, ImageDraw, ImageFont
import io
import os
from datetime import datetime, timedelta
from flask import current_app
import tempfile
import re

class ImageGenerator:
    """Service for generating images with gold price data"""
    
    @staticmethod
    def get_gold_price():
        """Scrape gold price from PublicGold website using BeautifulSoup"""
        try:
            # Add headers to mimic a browser request
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            
            # Make the request
            response = requests.get(
                "https://publicgold.com.my/index.php?route=dealer/page&pgcode=PG00104897&lang=ms",
                headers=headers,
                timeout=10
            )
            response.raise_for_status()
            
            # Parse the HTML
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Find the price element in the liveprice section
            price_element = soup.select_one("section#liveprice h4")
            if not price_element:
                raise Exception("Price element not found")
            
            # Extract and clean the price text
            price_text = price_element.text
            # Use regex to extract the numeric value
            price_match = re.search(r'(\d+(?:\.\d+)?)', price_text)
            if not price_match:
                raise Exception("Could not extract price from text")
                
            base_price = float(price_match.group(1))
            
            # Calculate buy and sell prices
            buy_price = base_price 
            sell_price = base_price * 0.91  # 9% spread
            
            return {
                'sell': f"{sell_price:.2f}",
                'buy': f"{buy_price:.2f}",
                'base': f"{base_price:.2f}",
                'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }
            
        except requests.RequestException as e:
            current_app.logger.error(f"Network error while scraping gold price: {str(e)}")
            return None
        except Exception as e:
            current_app.logger.error(f"Error scraping gold price: {str(e)}")
            return None

    @staticmethod
    def create_price_image(price_data):
        """Create image with gold price data"""
        try:
            # Get template configuration
            template_config = current_app.config.get('TEMPLATE_CONFIG', {
                'templateUrl': os.path.join(current_app.root_path, 'static', 'images', 'gold_template.png'),
                'textBoxes': [
                    {
                        'id': 'price',
                        'x': 50,
                        'y': 170,
                        'text': 'Current: RM {price}/gram'
                    },
                    # ... other text boxes
                ]
            })
            
            # Open template image
            img = Image.open(template_config['templateUrl'])
            draw = ImageDraw.Draw(img)
            
            # Load font
            font_path = os.path.join(current_app.root_path, 'static', 'fonts', 'arial.ttf')
            font = ImageFont.truetype(font_path, 60)
            
            # Draw text boxes from configuration
            for box in template_config['textBoxes']:
                text = box['text'].format(
                    price=price_data['base'],
                    buy=price_data['buy'],
                    sell=price_data['sell'],
                    timestamp=price_data['timestamp']
                )
                
                draw.text(
                    (box['x'], box['y']),
                    text,
                    font=font,
                    fill=(255, 255, 255)
                )
            
            # Save and return
            output_path = os.path.join(
                current_app.root_path, 
                'static', 
                'images', 
                'gold_prices', 
                f"gold_price_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
            )
            
            img.save(output_path)
            return output_path
            
        except Exception as e:
            current_app.logger.error(f"Error creating price image: {str(e)}")
            return None

    @classmethod
    def generate_gold_price_image(cls):
        """Main method to generate gold price image"""
        try:
            # Get price data
            price_data = cls.get_gold_price()
            if not price_data:
                raise Exception("Failed to get gold price data")
            
            # Create image
            image_path = cls.create_price_image(price_data)
            if not image_path:
                raise Exception("Failed to create price image")
            
            return image_path
            
        except Exception as e:
            current_app.logger.error(f"Error generating gold price image: {str(e)}")
            return None

    @classmethod
    def generate_and_post_status(cls, session_name):
        """Generate image and post to WhatsApp status"""
        try:
            from app.services.whatsapp_api import WhatsAppAPI
            
            # Generate image
            image_path = cls.generate_gold_price_image()
            if not image_path:
                raise Exception("Failed to generate image")
            
            # Post to WhatsApp status
            caption = "Daily Gold Price Update"
            response = WhatsAppAPI.send_status(
                session=session_name,
                image_path=image_path,
                caption=caption
            )
            
            # Clean up temporary file
            os.unlink(image_path)
            
            return response
            
        except Exception as e:
            current_app.logger.error(f"Error posting gold price status: {str(e)}")
            return None

    @staticmethod
    def cleanup_old_images(max_age_hours=24):
        """Clean up gold price images older than specified hours"""
        try:
            output_dir = os.path.join(current_app.root_path, 'static', 'images', 'gold_prices')
            if not os.path.exists(output_dir):
                return
            
            current_time = datetime.now()
            max_age = timedelta(hours=max_age_hours)
            
            for filename in os.listdir(output_dir):
                if not filename.startswith('gold_price_'):
                    continue
                
                file_path = os.path.join(output_dir, filename)
                file_time = datetime.fromtimestamp(os.path.getctime(file_path))
                
                if current_time - file_time > max_age:
                    try:
                        os.remove(file_path)
                        current_app.logger.info(f"Cleaned up old image: {filename}")
                    except Exception as e:
                        current_app.logger.warning(f"Failed to delete old image {filename}: {str(e)}")
                    
        except Exception as e:
            current_app.logger.error(f"Error during image cleanup: {str(e)}") 