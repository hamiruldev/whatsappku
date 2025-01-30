from flask import jsonify
from app.models.gold_price import GoldPrice
from app.models.image import ImageGenerator
from app.controllers.whatsapp import WhatsAppController
from app import app, scheduler

@app.route('/api/gold-prices', methods=['GET'])
def get_gold_prices():
    prices = GoldPrice.fetch_latest_prices()
    return jsonify(prices)

def schedule_gold_price_updates():
    def update_and_send():
        prices = GoldPrice.fetch_latest_prices()
        if prices:
            # Generate image
            image = ImageGenerator.create_gold_price_image(prices)
            
            # Save image temporarily
            temp_path = 'temp_gold_price.jpg'
            image.save(temp_path)
            
            # Send to WhatsApp status
            WhatsAppController.post_status(temp_path)
    
    # Schedule to run every day at 9 AM
    # scheduler.add_job(
    #     update_and_send,
    #     'cron',
    #     hour=9,
    #     minute=0
    # )