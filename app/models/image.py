from PIL import Image, ImageDraw, ImageFont
from datetime import datetime

class ImageGenerator:
    @staticmethod
    def create_gold_price_image(prices):
        # Create image with gold prices
        img = Image.new('RGB', (800, 600), color='white')
        draw = ImageDraw.Draw(img)
        font = ImageFont.truetype('path/to/font.ttf', 36)
        
        # Add prices and styling to image
        draw.text((50, 50), f"Gold Prices {datetime.now().strftime('%d/%m/%Y')}", font=font)
        draw.text((50, 150), f"1g: RM {prices['gram_1']}", font=font)
        # Add more prices...
        
        return img

    @staticmethod
    def create_birthday_card(user_data):
        # Create birthday card image
        pass