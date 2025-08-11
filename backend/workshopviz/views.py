from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.http import JsonResponse
from .influx_service import InfluxDBService
import json
from datetime import datetime
import logging
from django.conf import settings
import os
from influxdb_client import InfluxDBClient
from backend.settings import DB_LINK, INFLUX_TOKEN, DB_ORG
from helper.dashboard import getInfluxData
import pprint
import pandas as pd

logger = logging.getLogger(__name__)
def format_timestamp_for_display(timestamp):
    """Convert pandas Timestamp or ISO string to HH:MM format"""
    try:
        if isinstance(timestamp, pd.Timestamp):
            # Handle pandas Timestamp
            return timestamp.strftime('%H:%M')
        elif isinstance(timestamp, str):
            # Handle ISO string format
            dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
            return dt.strftime('%H:%M')
        else:
            return str(timestamp)
    except Exception as e:
        logger.warning(f"Error formatting timestamp {timestamp}: {e}")
        return str(timestamp)

def format_timestamps_in_data(data):
    """Format all timestamps in the data structure to HH:MM format."""
    if isinstance(data, dict):
        formatted_data = {}
        for key, value in data.items():
            if key.lower() in ['time', 'timestamp', '_time'] and (isinstance(value, (str, pd.Timestamp))):
                # This is likely a timestamp field
                formatted_data[key] = format_timestamp_for_display(value)
            elif isinstance(value, (dict, list)):
                # Recursively format nested structures
                formatted_data[key] = format_timestamps_in_data(value)
            else:
                formatted_data[key] = value
        return formatted_data
    
    elif isinstance(data, list):
        return [format_timestamps_in_data(item) for item in data]
    
    else:
        return data
    
@api_view(['GET'])
def get_dashboard_config(request):
    machine_name = request.GET.get('machine_name', 'Hurco')
    
    file_path = f"D:\\projects\\workshop-viz\\backend\\config\\{machine_name}.json"
    #file_path = f"E:\\ECPMG\\workshop-viz\\backend\\config\\{machine_name}.json"
    machine_data = getInfluxData(file_path)
    print("Machine Data:")
    pprint.pprint(machine_data, indent=2, width=120)

    #format timestamps in the machine data
    formatted_data = format_timestamps_in_data(machine_data)
    pprint.pprint(formatted_data, indent=2, width=120)

    return JsonResponse({
        'status': 'success',
        'message': 'Dashboard configuration loaded successfully',
        'data': formatted_data
    }, status=status.HTTP_200_OK)

@api_view(['GET'])
def test_influx_connection(request):
    """Test API endpoint to check InfluxDB connection"""
    try:
        client = InfluxDBClient(url=DB_LINK, token=INFLUX_TOKEN, org=DB_ORG, timeout=10_000)
        health = client.health()

        if health.status == "pass":
            return Response({
                'status': 'success',
                'message': 'Connection Successful',
                'data': {
                    'influxdb_version': health.version,
                    'server_time': datetime.now(datetime.timezone.utc).isoformat()
                }
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'status': 'error',
                'message': health.message,
                'data': {
                    'status': health.status,
                    'message': health.message,
                    'version': health.version
                }
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    except Exception as e:
        logger.error(f"Error testing InfluxDB connection: {str(e)}")
        return Response({
            'status': 'error',
            'message': f'Internal server error: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
