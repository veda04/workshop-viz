import logging
from influxdb_client import InfluxDBClient
from django.conf import settings
from datetime import datetime

logger = logging.getLogger(__name__)

class InfluxDBService:
    def __init__(self):
        self.client = InfluxDBClient(
            url=settings.INFLUX_URL,
            token=settings.INFLUX_TOKEN,
            org=settings.INFLUX_ORG
        )
        self.query_api = self.client.query_api()

    def test_connection(self):
        """Test the connection to InfluxDB"""
        try:
            # Try to get buckets to test connection
            buckets_api = self.client.buckets_api()
            buckets = buckets_api.find_buckets()
            return {
                'status': 'success',
                'message': 'Connected to InfluxDB successfully',
                'buckets': [bucket.name for bucket in buckets.buckets] if buckets.buckets else []
            }
        except Exception as e:
            logger.error(f"InfluxDB connection test failed: {str(e)}")
            return {
                'status': 'error',
                'message': f'Failed to connect to InfluxDB: {str(e)}'
            }
        
    def execute_flux_query(self, query):
        """Execute a Flux query against InfluxDB"""
        try:
            result = self.query_api.query(query)
            data = []
            for table in result:
                for record in table.records:
                    data.append({
                        'time': record.get_time().isoformat(),
                        'field': record.get_field(),
                        'value': record.get_value()
                    })
            return {'status': 'success', 'data': data}
        except Exception as e:
            logger.error(f"Error executing Flux query: {str(e)}")
            return {'status': 'error', 'message': str(e)}

    def close(self):
        """Close the InfluxDB client"""
        if self.client:
            self.client.close()
