import requests
from flask import current_app
from datetime import datetime

class HealthCheckService:
    """Service to monitor WAHA API health status"""
    
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