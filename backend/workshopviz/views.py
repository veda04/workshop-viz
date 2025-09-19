from urllib import response
from django.shortcuts import render
from reactivex import catch
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.http import JsonResponse
from .influx_service import InfluxDBService
from .mysql_service import MySQLService
import json
from datetime import datetime, timedelta
import logging
from django.conf import settings
import os
from influxdb_client import InfluxDBClient
from backend.settings import DB_LINK, INFLUX_TOKEN, DB_ORG
from helper.dashboard import getInfluxData
import pprint
import pandas as pd

@api_view(['GET'])
def test_mysql_connection(request):
    """Test API endpoint to check MySQL connection"""
    try:
        mysql_service = MySQLService()
        result = mysql_service.test_connection()
        
        if result['status'] == 'success':
            return JsonResponse(result, status=status.HTTP_200_OK)
        else:
            return JsonResponse(result, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            
    except Exception as e:
        logger.error(f"Error testing MySQL connection: {str(e)}")
        return JsonResponse({
            'status': 'error',
            'message': f'Internal server error: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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

# to get timedelta from range string like '1h', '30m', '2d'
def parse_range_to_timedelta(range_str):
    num = int(range_str[:-1])
    unit = range_str[-1]
    if unit == 'h':
        return timedelta(hours=num)
    elif unit == 'm':
        return timedelta(minutes=num)
    elif unit == 'd':
        return timedelta(days=num)
    elif unit == 's':
        return timedelta(seconds=num)
    else:
        raise ValueError("Unsupported time unit in range")

    
@api_view(['GET'])
def get_dashboard_config(request):
    machine_name = request.GET.get('machine_name', 'Hurco')
    selected_range = request.GET.get('range', None)
    custom_from = request.GET.get('from', None)
    custom_to = request.GET.get('to', None) 

    if selected_range:
        delta = parse_range_to_timedelta (selected_range)
        custom_date_from  = (datetime.now() - delta).strftime("%Y-%m-%dT%H:%M:%SZ")
        custom_date_to = datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ")
    else:
        # Ensure custom_from and custom_to are in 'YYYY-MM-DDTHH:MM:SSZ' format
        def ensure_iso8601_z(dt_str):
            try:
                # Try parsing with seconds
                dt = datetime.strptime(dt_str, "%Y-%m-%dT%H:%M:%S")
            except ValueError:
                try:
                    # Try parsing without seconds
                    dt = datetime.strptime(dt_str, "%Y-%m-%dT%H:%M")
                except ValueError:
                    # If already has 'Z', try parsing with 'Z'
                    try:
                        dt = datetime.strptime(dt_str, "%Y-%m-%dT%H:%M:%SZ")
                    except ValueError:
                        return dt_str  # Return as is if parsing fails
            else:
                return dt.strftime("%Y-%m-%dT%H:%M:%SZ")
            return dt.strftime("%Y-%m-%dT%H:%M:%SZ")

        custom_date_from = ensure_iso8601_z(custom_from) if custom_from else None
        custom_date_to = ensure_iso8601_z(custom_to) if custom_to else None

    file_path = f"D:\\projects\\workshop-viz\\backend\\config\\{machine_name}.json"
    #file_path = f"E:\\ECPMG\\workshop-viz\\backend\\config\\{machine_name}.json"
    machine_data = getInfluxData(file_path, custom_date_from, custom_date_to)
    #print("Machine Data:")
    #pprint.pprint(machine_data, indent=2, width=120)

    #format timestamps in the machine data
    formatted_data = format_timestamps_in_data(machine_data)
    #pprint.pprint(formatted_data, indent=2, width=120)

    return JsonResponse({
        'status': 'success',
        'message': 'Dashboard configuration loaded successfully',
        'data': formatted_data
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
def get_current_booking(request):
    """Get current booking information for a machine"""
    try:
        machine_name = request.GET.get('machine_name', 'Hurco')

        mysql_service = MySQLService()
        asset_id = mysql_service.get_machine_id(machine_name)

        if asset_id:
            machine_related_booking_ids = mysql_service.get_machine_related_bookings(asset_id['iAsset_id'])

            if machine_related_booking_ids:
                booking_ids_str = ",".join(str(booking['iBooking_id']) for booking in machine_related_booking_ids)
                today_date = datetime.now().strftime('%Y-%m-%d')
                current_bookings = mysql_service.get_booking_list(
                    f" AND iBooking_id IN ({booking_ids_str}) AND ('{today_date}' >= dStart AND '{today_date}' <= dEnd) AND cStatus IN('A', 'CO', 'IP') ORDER BY dStart DESC LIMIT 5"
                )

                # process the current booking to replace the iUser_id_req to the user 
                for booking in current_bookings:
                    if booking['iUser_id_req']:
                        booking['vbooked_by'] = mysql_service.get_booked_by_user(booking['iUser_id_req'])
                    
                    if booking['tStart']:
                        booking['tStart'] = format_timestamp_for_display(booking['tStart'])

                    if booking['tEnd']:
                        booking['tEnd'] = format_timestamp_for_display(booking['tEnd'])#
                if current_bookings:
                    return JsonResponse({
                        'status': 'success',
                        'message': 'Booking list retrieved successfully',
                        'data': current_bookings
                    }, status=status.HTTP_200_OK)
                else: 
                    return JsonResponse({
                        'status': 'error',
                        'message': 'No booking list found for the specified machine',
                        'data': {}
                    }, status=status.HTTP_404_NOT_FOUND)
            else: 
                return JsonResponse({
                    'status': 'error',
                    'message': 'No machine related bookings found for the specified machine',
                    'data': {}
                }, status=status.HTTP_404_NOT_FOUND)
        else:
            return JsonResponse({
                'status': 'error',
                'message': 'Machine id not found in the database',
                'data': {}
            }, status=status.HTTP_404_NOT_FOUND)
    
    except Exception as e:
        logger.error(f"Error retrieving current booking: {str(e)}")
        return JsonResponse({
            'status': 'error',
            'message': f'Internal server error: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def get_user_list(request):
    """Get user list from MySQL database"""
    try:
        mysql_service = MySQLService()
        user_list = mysql_service.get_user_list()
        
        if user_list is not None:
            return JsonResponse({
                'status': 'success',    
                'message': 'User list retrieved successfully',
                'data': user_list
            }, status=status.HTTP_200_OK)
        else:
            return JsonResponse({
                'status': 'error',
                'message': 'No user list found in the database',
                'data': []
            }, status=status.HTTP_404_NOT_FOUND)

    except Exception as e:
        logger.error(f"Error retrieving user list: {str(e)}")
        return JsonResponse({
            'status': 'error',
            'message': f'Internal server error: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@api_view(['POST'])
def add_notes(request):
    """Add notes to a booking"""
    try:
        # Get the data from the request body
        data = request.data
        description = data.get('description', '')
        category = data.get('category', '')
        startDateTime = data.get('startDate', '')
        startDate = startDateTime.split("T")[0] if "T" in startDateTime else startDateTime
        startTime = startDateTime.split("T")[1] if "T" in startDateTime else ''
        endDateTime = data.get('endDate', '')
        endDate = endDateTime.split("T")[0] if "T" in endDateTime else endDateTime
        endTime = endDateTime.split("T")[1] if "T" in endDateTime else ''
        user = data.get('user', '')

        if not all([description, category, startDate, startTime, endDate, endTime, user]):
            return JsonResponse({
                'status': 'error',
                'message': 'Missing required fields in the request body',
                'data': {}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        mysql_service = MySQLService()
        success = mysql_service.add_notes(description, category, startDate, startTime, endDate, endTime, user)
        print("Add notes success:", success)
        if success:
            return JsonResponse({
                'status': 'success',
                'message': 'Notes added successfully',
                'data': {}
            }, status=status.HTTP_201_CREATED)
        else:
            return JsonResponse({
                'status': 'error',
                'message': 'Failed to add notes to the database',
                'data': {}
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Exception as e:
        logger.error(f"Error adding notes: {str(e)}")
        return JsonResponse({
            'status': 'error',
            'message': f'Internal server error: {str(e)}',
            'data': {}
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)