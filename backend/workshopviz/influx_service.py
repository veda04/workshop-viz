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

    def get_machine_data(self, machine_id=None, limit=100):
        """Query machine data from InfluxDB"""
        try:
            if machine_id:
                query = f'''
                from(bucket: "{settings.MACHINE_DATA_BUCKET}")
                |> range(start: -1h)
                |> filter(fn: (r) => r._measurement == "machine_sensors")
                |> filter(fn: (r) => r.machine_id == "{machine_id}")
                |> limit(n: {limit})
                '''
            else:
                query = f'''
                from(bucket: "{settings.MACHINE_DATA_BUCKET}")
                |> range(start: -1h)
                |> filter(fn: (r) => r._measurement == "machine_sensors")
                |> limit(n: {limit})
                '''
            
            result = self.query_api.query(query)
            
            data = []
            for table in result:
                for record in table.records:
                    data.append({
                        'time': record.get_time().isoformat(),
                        'machine_id': record.values.get('machine_id'),
                        'field': record.get_field(),
                        'value': record.get_value()
                    })
            
            return {'status': 'success', 'data': data}
        except Exception as e:
            logger.error(f"Error querying machine data: {str(e)}")
            return {'status': 'error', 'message': str(e)}

    def get_machine_summary(self, machine_id=None):
        """Get machine summary data"""
        try:
            if machine_id:
                query = f'''
                from(bucket: "{settings.MACHINE_SUMMARY_DATA_BUCKET}")
                |> range(start: -24h)
                |> filter(fn: (r) => r._measurement == "machine_summary")
                |> filter(fn: (r) => r.machine_id == "{machine_id}")
                |> last()
                '''
            else:
                query = f'''
                from(bucket: "{settings.MACHINE_SUMMARY_DATA_BUCKET}")
                |> range(start: -24h)
                |> filter(fn: (r) => r._measurement == "machine_summary")
                |> group(columns: ["machine_id"])
                |> last()
                '''
            
            result = self.query_api.query(query)
            
            data = []
            for table in result:
                for record in table.records:
                    data.append({
                        'time': record.get_time().isoformat(),
                        'machine_id': record.values.get('machine_id'),
                        'field': record.get_field(),
                        'value': record.get_value()
                    })
            
            return {'status': 'success', 'data': data}
        except Exception as e:
            logger.error(f"Error querying machine summary: {str(e)}")
            return {'status': 'error', 'message': str(e)}

    def close(self):
        """Close the InfluxDB client"""
        if self.client:
            self.client.close()
