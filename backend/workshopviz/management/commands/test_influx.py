from django.core.management.base import BaseCommand
from workshopviz.influx_service import InfluxDBService

class Command(BaseCommand):
    help = 'Test InfluxDB connection and setup'

    def handle(self, *args, **options):
        self.stdout.write('Testing InfluxDB connection...')
        
        try:
            influx_service = InfluxDBService()
            result = influx_service.test_connection()
            
            if result['status'] == 'success':
                self.stdout.write(
                    self.style.SUCCESS(f"✅ {result['message']}")
                )
                if result.get('buckets'):
                    self.stdout.write('Available buckets:')
                    for bucket in result['buckets']:
                        self.stdout.write(f"  - {bucket}")
            else:
                self.stdout.write(
                    self.style.ERROR(f"❌ {result['message']}")
                )
            
            influx_service.close()
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"❌ Error: {str(e)}")
            )
