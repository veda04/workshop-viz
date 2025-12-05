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
from datetime import datetime, timedelta, timezone
import logging
from django.conf import settings
import os
from influxdb_client import InfluxDBClient
from backend.settings import DB_LINK, INFLUX_TOKEN, DB_ORG, MACHINE_CONFIG_PATH
from helper.dashboard import getCustomData, getInfluxData, getDataSeries
import pprint
import pandas as pd

# Debug: Check if MACHINE_CONFIG_PATH is loaded correctly
# if MACHINE_CONFIG_PATH is None:
#     print("WARNING: MACHINE_CONFIG_PATH is None. Check .env file and ensure it's in the correct location.")
#     print("Current working directory:", os.getcwd())
#     print("Looking for .env file in backend directory")
# else:
#     print("Config Path:", MACHINE_CONFIG_PATH)

# ============================================================================
# ATMAS DB related APIs
# ============================================================================
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

# ATMAS related APIs
# get the current booking for a machine
@api_view(['GET'])
def get_current_booking(request):
    """Get current booking information for a machine"""
    try:
        machine_name = request.GET.get('machine_name')

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
                        booking['tEnd'] = format_timestamp_for_display(booking['tEnd'])
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
                    }, status=status.HTTP_200_OK)
            else: 
                return JsonResponse({
                    'status': 'error',
                    'message': 'No machine related bookings found for the specified machine',
                    'data': {}
                }, status=status.HTTP_200_OK)
        else:
            return JsonResponse({
                'status': 'error',
                'message': 'Machine id not found in the database',
                'data': {}
            }, status=status.HTTP_200_OK)
    
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
    
@api_view(['GET'])
def get_asset_id_by_name(request):
    """Get asset ID by name from MySQL database"""
    try:
        asset_name = request.GET.get('name', '')
        
        if not asset_name:
            return JsonResponse({
                'status': 'error',
                'message': 'Asset name is required',
                'data': {}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        mysql_service = MySQLService()
        asset_id = mysql_service.get_asset_id_by_name(asset_name)
        
        if asset_id is not None:
            return JsonResponse({
                'status': 'success',    
                'message': 'Asset ID retrieved successfully',
                'data': asset_id
            }, status=status.HTTP_200_OK)
        else:
            return JsonResponse({
                'status': 'error',
                'message': 'No asset found with the given name',
                'data': {}
            }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error retrieving asset ID: {str(e)}")
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
        asset_name = data.get('machine_name', '')
        
        if not asset_name:
            return JsonResponse({
                'status': 'error',
                'message': 'Machine name is required',
                'data': {}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        mysql_service = MySQLService()
        asset_data = mysql_service.get_asset_id_by_name(asset_name)
        
        if not asset_data:
            return JsonResponse({
                'status': 'error',
                'message': 'Asset not found',
                'data': {}
            }, status=status.HTTP_200_OK)
        
        if asset_data is None:
            asset_id = None
        elif isinstance(asset_data, dict):
            asset_id = asset_data.get('iAsset_id')
        else:
            asset_id = asset_data if asset_data else None
        description = data.get('description', '')
        category = data.get('category', '')
        startDateTime = data.get('startDate', '')
        startDate = startDateTime.split("T")[0] if "T" in startDateTime else startDateTime
        startTime = startDateTime.split("T")[1] if "T" in startDateTime else ''
        endDateTime = data.get('endDate', '')
        endDate = endDateTime.split("T")[0] if "T" in endDateTime else endDateTime
        endTime = endDateTime.split("T")[1] if "T" in endDateTime else ''
        user_id = data.get('user_id', '')
        print("Add notes data:", asset_id, asset_name, description, category, startDate, startTime, endDate, endTime, user_id)

        if not all([asset_id, asset_name, description, category, startDate, startTime, endDate, endTime, user_id]):
            return JsonResponse({
                'status': 'error',
                'message': 'Missing required fields in the request body',
                'data': {}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        mysql_service = MySQLService()
        success = mysql_service.add_notes(asset_id, asset_name, description, category, startDate, startTime, endDate, endTime, user_id)
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
    

# ============================================================================
# Influx DB related APIs
# ============================================================================
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
                    #'server_time': datetime.now(timezone.utc).isoformat()  # uncomment incase of connection fails 
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

@api_view(['GET'])
def get_dashboard_config(request):
    try:
        machine_name = request.GET.get('machine_name')
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

        file_path = os.path.join(MACHINE_CONFIG_PATH, f"{machine_name}.json")
        machine_data = getInfluxData(file_path, custom_date_from, custom_date_to)
        #print("Machine Data:")
        #pprint.pprint(machine_data, indent=2, width=120)

        return JsonResponse({
            'status': 'success',
            'message': 'Dashboard configuration loaded successfully',
            'data': machine_data,
        }, status=status.HTTP_200_OK)
        
    except FileNotFoundError as e:
        logger.error(f"Configuration file not found: {str(e)}")
        return JsonResponse({
            'status': 'error',
            'message': f'Configuration file not found for machine "{machine_name}". Please check if the machine configuration exists.',
            'data': {}
        }, status=status.HTTP_404_NOT_FOUND)
    
    except ValueError as e:
        logger.error(f"Invalid data format: {str(e)}")
        return JsonResponse({
            'status': 'error',
            'message': f'Invalid data format: {str(e)}',
            'data': {}
        }, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        logger.error(f"Error loading dashboard configuration: {str(e)}")
        return JsonResponse({
            'status': 'error',
            'message': f'Error loading dashboard configuration: {str(e)}',
            'data': {}
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    """Get list of available machines from config directory"""
    try:
        config_dir = MACHINE_CONFIG_PATH
        
        if not os.path.exists(config_dir):
            return JsonResponse({
                'status': 'error',
                'message': 'Config directory not found',
                'data': []
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Get all JSON files in config directory
        json_files = [f for f in os.listdir(config_dir) if f.endswith('.json')]

        print("JSON files in config directory:", json_files)
        
        # Filter out files with '-' in name and remove .json extension
        machine_names = [
            os.path.splitext(f)[0] 
            for f in json_files 
            if '-' not in f
        ]

        print("Available machines from config:", machine_names)
        
        return JsonResponse({
            'status': 'success',
            'message': 'Machine list retrieved successfully',
            'data': machine_names
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.error(f"Error retrieving machine list: {str(e)}")
        return JsonResponse({
            'status': 'error',
            'message': f'Internal server error: {str(e)}',
            'data': []
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def get_machines_with_config(request):
    """Get machines from DB that have config files"""
    try:
        mysql_service = MySQLService()
        
        # Get all machine assets from database
        db_machines = mysql_service.get_machine_assets()
        
        if db_machines is None:
            return JsonResponse({
                'status': 'error',
                'message': 'Failed to retrieve machines from database',
                'data': []
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Get config directory path
        config_dir = MACHINE_CONFIG_PATH
        
        if not os.path.exists(config_dir):
            return JsonResponse({
                'status': 'error',
                'message': 'Config directory not found',
                'data': []
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Get all JSON config files (excluding files with '-')
        json_files = [f for f in os.listdir(config_dir) if f.endswith('.json') and '-' not in f]
        config_machine_names = [os.path.splitext(f)[0] for f in json_files]
        
        # print("Machines from DB:", [m['vName'] for m in db_machines])
        # print("Machines from config:", config_machine_names)
        
        # Filter machines: Only include if BOTH in DB AND has config file
        machines_with_config = []
        
        # Add only machines that have config files AND exist in database
        for config_name in config_machine_names:
            # Find matching DB entry
            db_match = next((m for m in db_machines if m['vName'] == config_name), None)
            
            # Only add if machine exists in database
            if db_match:
                machines_with_config.append({
                    'iAsset_id': db_match['iAsset_id'],
                    'vName': config_name,
                    'hasConfig': True,
                    'inDatabase': True
                })
        
        #print("Machines with config (DB only):", machines_with_config)
        
        return JsonResponse({
            'status': 'success',
            'message': 'Machines with config retrieved successfully',
            'data': machines_with_config
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.error(f"Error retrieving machines with config: {str(e)}")
        return JsonResponse({
            'status': 'error',
            'message': f'Internal server error: {str(e)}',
            'data': []
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def get_dropdowns_from_config(request):
    """Get non-machine assets from config files"""
    try:
        config_dir = MACHINE_CONFIG_PATH
        
        if not os.path.exists(config_dir):
            return JsonResponse({
                'status': 'error',
                'message': 'Config directory not found',
                'data': []
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Get all JSON files in config directory
        json_files = [f for f in os.listdir(config_dir) if f.endswith('.json')]

        dropdown_names = []
        
        for file_name in json_files:
            if 'Dropdown' in file_name:
                dropdown_names.append(os.path.splitext(file_name)[0])

        # print("Dropdowns from config:", dropdown_names)

        return JsonResponse({
            'status': 'success',
            'message': 'Dropdown list retrieved successfully',
            'data': dropdown_names
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.error(f"Error retrieving dropdowns: {str(e)}")
        return JsonResponse({
            'status': 'error',
            'message': f'Internal server error: {str(e)}',
            'data': []
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def create_dashboard(request):
    """Create a new dashboard in visualisation_dashboards table"""
    try:
        data = request.data
        
        # Extract form data
        title = data.get('title', '').strip()
        dashboard_type = data.get('dashboardType', '')
        machine_name = data.get('machineName', '')
        user_id = data.get('userId', '')
        
        # Validate required fields
        if not title:
            return JsonResponse({
                'status': 'error',
                'message': 'Dashboard title is required',
                'data': {}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not user_id:
            return JsonResponse({
                'status': 'error',
                'message': 'User ID is required',
                'data': {}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Determine category based on dashboard type
        category = 'MACH' if dashboard_type == 'machine' else 'GENR'
        
        # Get asset_id if machine specific
        asset_id = None
        if dashboard_type == 'machine':
            if not machine_name:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Machine name is required for machine-specific dashboard',
                    'data': {}
                }, status=status.HTTP_400_BAD_REQUEST)
            
            mysql_service = MySQLService()
            asset_id = mysql_service.get_asset_id_by_name(machine_name)
            
            if asset_id is None:
                return JsonResponse({
                    'status': 'error',
                    'message': f'Machine "{machine_name}" not found in database',
                    'data': {}
                }, status=status.HTTP_404_NOT_FOUND)
        else:
            asset_id = 0   # For general dashboards, asset_id is 0 as there is no specific machine associated at that stage 
        
        # Create dashboard
        mysql_service = MySQLService()
        dashboard_id = mysql_service.create_dashboard(title, asset_id, user_id, category)
        
        if dashboard_id:
            return JsonResponse({
                'status': 'success',
                'message': 'Dashboard created successfully',
                'data': {
                    'dashboardId': dashboard_id,
                    'title': title,
                    'machineName': machine_name,
                    'category': category
                }
            }, status=status.HTTP_201_CREATED)
        else:
            return JsonResponse({
                'status': 'error',
                'message': 'Failed to create dashboard',
                'data': {}
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    except Exception as e:
        logger.error(f"Error creating dashboard: {str(e)}")
        return JsonResponse({
            'status': 'error',
            'message': f'Internal server error: {str(e)}',
            'data': {}
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
def get_data_types(request):
    """Get available data types from config file"""
    try:
        machine_name = request.GET.get('machine_name')
        file_path = os.path.join(MACHINE_CONFIG_PATH, f"{machine_name}.json")
        
        if not os.path.exists(file_path):
            return JsonResponse({
                'status': 'error',
                'message': f'Configuration file not found for machine: {machine_name}',
                'data': []
            }, status=status.HTTP_404_NOT_FOUND)
        
        with open(file_path, 'r', encoding='utf-8') as f:
            machine_config = json.load(f)
        
        # Extract graph configurations from the 'Data' section
        graph_configs = []
        
        if 'Data' in machine_config and isinstance(machine_config['Data'], dict):
            for idx, (title, config) in enumerate(machine_config['Data'].items(), start=1):
                # Extract unit and pivot information
                bucket = config.get('Bucket', '')
                measurement = config.get('Measurement', '')
                unit = config.get('Units', '')
                pivot = config.get('Pivot', None)
                scale = config.get('Scale', 'linear')
                
            
                graph_configs.append({
                    'id': str(idx),  # Use sequential IDs
                    'title': title,  # Use the key as title (e.g., 'Acceleration', 'Air Flow', 'Air Pressure')
                    'unit': unit,
                    'bucket': bucket,
                    'measurement': measurement,
                    'pivot': pivot,
                    'scale': scale,
                    'timeRange': '3h',  # Default time range
                    'availableSeries': []  # Will be populated dynamically
                })
        
        logger.info(f"Generated {len(graph_configs)} graph configurations with titles: {[g['title'] for g in graph_configs]}")

        return JsonResponse({
            'status': 'success',
            'message': 'Graph configurations retrieved successfully',
            'data': graph_configs
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.error(f"Error retrieving graph configurations: {str(e)}")
        return JsonResponse({
            'status': 'error',
            'message': f'Internal server error: {str(e)}',
            'data': []
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
def get_available_series(request):
    """Get available series for a specific graph"""
    try:
        machine_name = request.GET.get('machine_name')
        graph_id = request.GET.get('graph_id')
        time_range = request.GET.get('range', '3h')
        
        if not graph_id:
            return JsonResponse({
                'status': 'error',
                'message': 'Graph ID is required',
                'data': []
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Load the configuration file
        file_path = os.path.join(MACHINE_CONFIG_PATH, f"{machine_name}.json")
        
        if not os.path.exists(file_path):
            return JsonResponse({
                'status': 'error',
                'message': f'Configuration file not found for machine: {machine_name}',
                'data': []
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Load the JSON configuration
        with open(file_path, 'r', encoding='utf-8') as f:
            machine_config = json.load(f)
        
        if 'Data' not in machine_config or not isinstance(machine_config['Data'], dict):
            return JsonResponse({
                'status': 'error',
                'message': 'Invalid configuration structure',
                'data': []
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Get the data type configuration based on graph_id, graph_id corresponds to the index in the Data dictionary (1-indexed)
        data_types = list(machine_config['Data'].items())
        graph_index = int(graph_id) - 1
        
        if graph_index < 0 or graph_index >= len(data_types):
            return JsonResponse({
                'status': 'error',
                'message': f'Invalid graph ID: {graph_id}',
                'data': []
            }, status=status.HTTP_400_BAD_REQUEST)
        
        data_type_name, data_type_config = data_types[graph_index]

        available_series = []
        
        # Check if this data type has Predicates - if yes, use getDataSeries
        if 'Predicates' in data_type_config and 'Pivot' in data_type_config:
            available_series = getDataSeries(data_type_config)
            # print("Available series from getDataSeries:", available_series)

            if available_series is None:
                available_series = None
            
            # getDataSeries returns False if Predicates not found (shouldn't happen here)
            if available_series is None or available_series is False:
                available_series = []
        else:
            logger.info(f"No Predicates found for {data_type_name}, returning empty or single series")
            available_series = []
        
        logger.info(f"Available series for graph {graph_id} ({data_type_name}): {available_series}")
        
        return JsonResponse({
            'status': 'success',
            'message': 'Available series retrieved successfully',
            'data_for': data_type_name,
            'data': available_series
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.error(f"Error retrieving available series: {str(e)}")
        return JsonResponse({
            'status': 'error',
            'message': f'Internal server error: {str(e)}',
            'data': []
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@api_view(['POST'])
def generate_data(request):
    """Get custom graph data based on selected graphs and series"""
    try:
        data = request.data
        machine_name = data.get('machine_name')  # For backward compatibility
        machine_names = data.get('machine_names', [])  # New: array of machine names per graph
        selected_type = data.get('type', None)
        selected_graphs = data.get('graphs', [])
        selected_series = data.get('series', {})
        time_range = data.get('range', '3h')
        
        # Backward compatibility: if machine_names not provided, use machine_name for all graphs
        if not machine_names:
            machine_names = [machine_name] * len(selected_graphs)
        
        if not selected_graphs:
            return JsonResponse({
                'status': 'error',
                'message': 'No graphs selected',
                'data': {}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if len(machine_names) != len(selected_graphs):
            return JsonResponse({
                'status': 'error',
                'message': 'Number of machine names must match number of selected graphs',
                'data': {}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Calculate time range
        delta = parse_range_to_timedelta(time_range)
        custom_date_from = (datetime.now() - delta).strftime("%Y-%m-%dT%H:%M:%SZ")
        custom_date_to = datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ")
        
        # Process each graph with its corresponding machine/dropdown
        all_machine_data = []
        machine_metadata = []  # Store metadata about each graph's source
        
        for idx, (graph_id, machine_name_for_graph) in enumerate(zip(selected_graphs, machine_names)):
            file_path = os.path.join(MACHINE_CONFIG_PATH, f"{machine_name_for_graph}.json")
            
            if not os.path.exists(file_path):
                logger.warning(f'Configuration file not found for: {machine_name_for_graph}')
                all_machine_data.append(None)
                continue
            
            # Load the config file to get graph names
            with open(file_path, 'r', encoding='utf-8') as f:
                machine_config = json.load(f)

            data_types = list(machine_config.get('Data', {}).items())
            
            # Build graph info for this specific graph
            graph_index = int(graph_id) - 1
            if graph_index >= 0 and graph_index < len(data_types):
                data_type_name, data_type_config = data_types[graph_index]
                graphs_info = [{
                    'id': int(graph_id),
                    'name': data_type_name,
                    'aggregation': 'max',
                    'series': selected_series.get(str(graph_id), [])
                }]
                
                customised_config_data = {
                    'date_from': custom_date_from,
                    'date_to': custom_date_to,
                    'data_types': graphs_info,
                    'machine_name': machine_name_for_graph,
                    "type": selected_type
                }
                
                # Get data for this machine/dropdown
                machine_data = getCustomData(customised_config_data, file_path)
                
                if machine_data and len(machine_data) > 0:
                    all_machine_data.append(machine_data[0])  # Get first element as we only query one graph at a time
                    machine_metadata.append({
                        'graph_id': str(graph_id),
                        'machine_name': machine_name_for_graph,
                        'data_type_name': data_type_name,
                        'unit': data_type_config.get('Unit', ''),
                        'series': selected_series.get(str(graph_id), [])
                    })
                else:
                    all_machine_data.append(None)
            else:
                all_machine_data.append(None)
        
        logger.info(f"Processed {len(all_machine_data)} machines/dropdowns")
        pprint.pprint("****** All Machine Data  ******:")
        pprint.pprint(all_machine_data, indent=2, width=120)
        
        # Merge data from multiple machines/dropdowns
        combined_data = {
            'chartData': [],
            'series': [],
            'unit': '',
            'machineMetadata': machine_metadata  # Include metadata for frontend
        }
        
        all_timestamps = set()
        series_data_map = {}
        
        # Process each machine's data
        for idx, data_list in enumerate(all_machine_data):
            if data_list is None or not isinstance(data_list, list):
                continue
            
            metadata = machine_metadata[idx] if idx < len(machine_metadata) else None
            if not metadata:
                continue
            
            graph_series = metadata['series']
            
            # Process each data entry in the list
            for entry in data_list:
                timestamp = entry.get('time')
                if timestamp:
                    all_timestamps.add(timestamp)
                    
                    # Process each series - look for matching series names in the entry
                    for series_name in graph_series:
                        if series_name in entry:
                            if series_name not in series_data_map:
                                series_data_map[series_name] = {}
                                combined_data['series'].append(series_name)
                            
                            # Store or aggregate values for the same timestamp
                            if timestamp not in series_data_map[series_name]:
                                series_data_map[series_name][timestamp] = []
                            series_data_map[series_name][timestamp].append(entry[series_name])
        
        # Build combined chart data - average values for same timestamps
        sorted_timestamps = sorted(list(all_timestamps))
        for timestamp in sorted_timestamps:
            data_point = {'time': timestamp}
            for series_name in combined_data['series']:
                if timestamp in series_data_map[series_name]:
                    values = series_data_map[series_name][timestamp]
                    # Average multiple values for the same timestamp
                    data_point[series_name] = sum(values) / len(values) if values else None
                else:
                    data_point[series_name] = None
            combined_data['chartData'].append(data_point)
        
        logger.info(f"Generated custom graph data with {len(combined_data['chartData'])} points and {len(combined_data['series'])} series from {len(machine_metadata)} sources")
        
        return JsonResponse({
            'status': 'success',
            'message': 'Custom graph data retrieved successfully',
            'data': combined_data
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.error(f"Error retrieving custom graph data: {str(e)}")
        return JsonResponse({
            'status': 'error',
            'message': f'Internal server error: {str(e)}',
            'data': {}
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)