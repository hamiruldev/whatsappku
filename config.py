import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'your-secret-key'
    WAHA_API_URL = 'https://my-app-352501285879.asia-southeast1.run.app'
    WAHA_SESSION = 'session'
    PUBLIC_GOLD_URL = 'https://publicgold.com.my/'
    POCKETBASE_URL = 'https://hamirulhafizal.pockethost.io' 