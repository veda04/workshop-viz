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
from helper.dashboard import getInfluxData, getDataSeries
import pprint
import pandas as pd
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
from helper.dashboard import getDataSeries, getInfluxData
import pprint
import pandas as pd

# Debug: Check if MACHINE_CONFIG_PATH is loaded correctly
# if MACHINE_CONFIG_PATH is None:
#     print("WARNING: MACHINE_CONFIG_PATH is None. Check .env file and ensure it's in the correct location.")
#     print("Current working directory:", os.getcwd())
#     print("Looking for .env file in backend directory")
# else:
#     print("Config Path:", MACHINE_CONFIG_PATH)

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
    
@api_view(['GET'])
def get_graph_configurations(request):
    """Get available graph configurations from config file"""
    try:
        machine_name = request.GET.get('machine_name')
        file_path = os.path.join(MACHINE_CONFIG_PATH, f"{machine_name}-v2.json")    # changed the config file to -v2.json
        
        if not os.path.exists(file_path):
            return JsonResponse({
                'status': 'error',
                'message': f'Configuration file not found for machine: {machine_name}',
                'data': []
            }, status=status.HTTP_404_NOT_FOUND)
        
        with open(file_path, 'r', encoding='utf-8') as f:
            config_data = json.load(f)
        
        # The JSON structure has the machine name as the top-level key. e.g., {"Hurco": {"Data": {...}}}
        machine_config = config_data.get(machine_name, {})
        
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
    
@api_view(['GET'])
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
        file_path = os.path.join(MACHINE_CONFIG_PATH, f"{machine_name}-v2.json")
        
        if not os.path.exists(file_path):
            return JsonResponse({
                'status': 'error',
                'message': f'Configuration file not found for machine: {machine_name}',
                'data': []
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Load the JSON configuration
        with open(file_path, 'r', encoding='utf-8') as f:
            config_data = json.load(f)
        
        # Extract machine configuration
        machine_config = config_data.get(machine_name, {})
        
        if 'Data' not in machine_config or not isinstance(machine_config['Data'], dict):
            return JsonResponse({
                'status': 'error',
                'message': 'Invalid configuration structure',
                'data': []
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Get the data type configuration based on graph_id
        # graph_id corresponds to the index in the Data dictionary (1-indexed)
        data_types = list(machine_config['Data'].items())
        graph_index = int(graph_id) - 1
        
        if graph_index < 0 or graph_index >= len(data_types):
            return JsonResponse({
                'status': 'error',
                'message': f'Invalid graph ID: {graph_id}',
                'data': []
            }, status=status.HTTP_400_BAD_REQUEST)
        
        data_type_name, data_type_config = data_types[graph_index]
        
        # pprint.pprint(f"******** Getting available series for: {data_type_name} (graph_id: {graph_id})")
        
        available_series = []
        
        # Check if this data type has Predicates - if yes, use getDataSeries
        if 'Predicates' in data_type_config:
            #pprint.pprint(f"Using getDataSeries for {data_type_name} (has Predicates)")
            available_series = getDataSeries(data_type_config)

            #pprint.pprint(f"Available series from getDataSeries: {available_series}")
            
            # getDataSeries returns False if Predicates not found (shouldn't happen here)
            if available_series is False:
                available_series = []
        else:
            # No Predicates - this means it's a simple measurement without pivot
            # In this case, there's typically only one series or we can't determine series dynamically
            logger.info(f"No Predicates found for {data_type_name}, returning empty or single series")
            # For measurements without Predicates and Pivot, we might just return the measurement name
            # or an empty list as the frontend should handle this case
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
def custom_graph_data(request):
    """Get custom graph data based on selected graphs and series"""
    try:
        data = request.data
        machine_name = data.get('machine_name')
        selected_graphs = data.get('graphs', [])
        selected_series = data.get('series', {})
        time_range = data.get('range', '3h')

        #print("******* Custom graph data request:", machine_name, selected_graphs, selected_series, time_range)
        
        if not selected_graphs:
            return JsonResponse({
                'status': 'error',
                'message': 'No graphs selected',
                'data': {}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Calculate time range
        delta = parse_range_to_timedelta(time_range)
        custom_date_from = (datetime.now() - delta).strftime("%Y-%m-%dT%H:%M:%SZ")
        custom_date_to = datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ")
        
        file_path = os.path.join(MACHINE_CONFIG_PATH, f"{machine_name}-v2.json")
        
        if not os.path.exists(file_path):
            return JsonResponse({
                'status': 'error',
                'message': f'Configuration file not found for machine: {machine_name}',
                'data': {}
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Load the config file to get graph names
        with open(file_path, 'r', encoding='utf-8') as f:
            config_data = json.load(f)
        
        machine_config = config_data.get(machine_name, {})
        data_types = list(machine_config.get('Data', {}).items())
        
        # Build graph info with IDs and names and series 
        graphs_info = []
        for graph_id in selected_graphs:
            graph_index = int(graph_id) - 1
            if graph_index >= 0 and graph_index < len(data_types):
                data_type_name, data_type_config = data_types[graph_index]
                graphs_info.append({
                    'id': int(graph_id),
                    'name': data_type_name,
                    'series': selected_series.get(str(graph_id), [])
                })

        custom_graph_config_data = {
            'date_from': custom_date_from,
            'date_to': custom_date_to,
            'data_types': graphs_info,  # Now includes both id and name and series 
            'machine_name': machine_name,
        }

        #pprint.pprint("****** Custom Graph Config Data  :")        
        #pprint.pprint( custom_graph_config_data, indent=2, width=120)

        # Get full dashboard data
        machine_data = getInfluxData(file_path, custom_date_from, custom_date_to, custom_graph_config_data)   #  getInfluxData(file_path, custom_date_from, custom_date_to)
        pprint.pprint("****** Machine Data  ******:")
        pprint.pprint( machine_data, indent=2, width=120) 
        
        # Filter data based on selected graphs and series
        combined_data = {
            'chartData': [],
            'series': [],
            'unit': ''
        }
        
        all_timestamps = set()
        series_data_map = {}
        
        for graph_id in selected_graphs:
            # machine_data is a list, find the item that matches the graph_id
            graph_index = int(graph_id) - 1
            
            if graph_index >= 0 and graph_index < len(machine_data):
                item = machine_data[graph_index]
                graph_series = selected_series.get(str(graph_id), [])
                
                # Get unit from config if available
                if not combined_data['unit'] and 'config' in item:
                    # Extract unit from Queries if available
                    if 'Queries' in item['config'] and len(item['config']['Queries']) > 0:
                        combined_data['unit'] = item['config']['Queries'][0].get('Units', '')
                
                if 'data' in item and item['data']:
                    # item['data'] is a list of data arrays (one per query)
                    for df_data in item['data']:
                        if df_data:
                            for entry in df_data:
                                timestamp = entry.get('time')
                                if timestamp:
                                    all_timestamps.add(timestamp)
                                    
                                    # Process each series
                                    for series_name in graph_series:
                                        if series_name in entry:
                                            if series_name not in series_data_map:
                                                series_data_map[series_name] = {}
                                                combined_data['series'].append(series_name)
                                            
                                            series_data_map[series_name][timestamp] = entry[series_name]
        
        # Build combined chart data
        sorted_timestamps = sorted(list(all_timestamps))
        for timestamp in sorted_timestamps:
            data_point = {'time': timestamp}
            for series_name in combined_data['series']:
                data_point[series_name] = series_data_map[series_name].get(timestamp, None)
            combined_data['chartData'].append(data_point)
        
        logger.info(f"Generated custom graph data with {len(combined_data['chartData'])} points and {len(combined_data['series'])} series")
        
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

@api_view(['POST'])
def save_custom_graph(request):
    """Save custom graph configuration to MySQL database"""
    try:
        # Get the data from the request body
        data = request.data
        machine_name = data.get('machine_name', '')
        title = data.get('title', '')
        user_id = data.get('user_id', '')
        add_to_dashboard = data.get('add_to_dashboard', 'N')  # 'Y' or 'N'
        graph_types = data.get('graph_types', [])
        series = data.get('series', {})
        
        # Validation
        if not machine_name:
            return JsonResponse({
                'status': 'error',
                'message': 'Machine name is required',
                'data': {}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not title:
            return JsonResponse({
                'status': 'error',
                'message': 'Graph title is required',
                'data': {}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not user_id:
            return JsonResponse({
                'status': 'error',
                'message': 'User ID is required',
                'data': {}
            }, status=status.HTTP_400_BAD_REQUEST)

        if not add_to_dashboard in ['Y', 'N']:
            return JsonResponse({
                'status': 'error',
                'message': 'add_to_dashboard must be either "Y" or "N"',
                'data': {}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not graph_types or len(graph_types) == 0:
            return JsonResponse({
                'status': 'error',
                'message': 'At least one graph type must be selected',
                'data': {}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get asset ID from machine name (following the same pattern as add_notes)
        mysql_service = MySQLService()
        asset_data = mysql_service.get_asset_id_by_name(machine_name)
        
        if not asset_data:
            return JsonResponse({
                'status': 'error',
                'message': 'Machine not found',
                'data': {}
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Extract asset_id from the result
        if asset_data is None:
            asset_id = None
        elif isinstance(asset_data, dict):
            asset_id = asset_data.get('iAsset_id')
        else:
            asset_id = asset_data if asset_data else None
        
        if not asset_id:
            return JsonResponse({
                'status': 'error',
                'message': 'Invalid machine ID',
                'data': {}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Convert graph_types and series to JSON strings
        graph_types_json = json.dumps(graph_types)
        series_json = json.dumps(series)
        
        logger.info(f"Saving custom graph: {title} for machine {machine_name} (asset_id: {asset_id})")
        logger.info(f"Graph types: {graph_types_json}")
        logger.info(f"Series: {series_json}")
        
        # Save to database
        graph_id = mysql_service.save_custom_graph(
            asset_id, 
            title, 
            graph_types_json, 
            series_json, 
            user_id,
            add_to_dashboard
        )
        
        if graph_id:
            return JsonResponse({
                'status': 'success',
                'message': 'Custom graph saved successfully',
                'data': {'graph_id': graph_id}
            }, status=status.HTTP_201_CREATED)
        else:
            return JsonResponse({
                'status': 'error',
                'message': 'Failed to save custom graph',
                'data': {}
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    except Exception as e:
        logger.error(f"Error saving custom graph: {str(e)}")
        return JsonResponse({
            'status': 'error',
            'message': f'Internal server error: {str(e)}',
            'data': {}
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@api_view(['GET'])
def get_custom_graphs(request):
    """Get saved custom graphs for a machine"""
    try:
        machine_name = request.GET.get('machine_name') 
        if not machine_name:
            return JsonResponse({
                'status': 'error',
                'message': 'Machine name is required',
                'data': []
            }, status=status.HTTP_400_BAD_REQUEST)
        
        mysql_service = MySQLService()
        asset_data = mysql_service.get_asset_id_by_name(machine_name)

        if not asset_data:
            return JsonResponse({
                'status': 'error',
                'message': 'Machine not found',
                'data': []
            }, status=status.HTTP_404_NOT_FOUND)
        
        if isinstance(asset_data, dict):
            asset_id = asset_data.get('iAsset_id')
        else:
            asset_id = asset_data if asset_data else None
        
        if not asset_id:
            return JsonResponse({
                'status': 'error',
                'message': 'Invalid machine ID',
                'data': []
            }, status=status.HTTP_400_BAD_REQUEST)
        
        custom_graphs = mysql_service.get_custom_graphs(asset_id)
        if custom_graphs is not None:
            # Parse JSON strings back to objects
            for graph in custom_graphs:
                if 'vGraph_types' in graph and isinstance(graph['vGraph_types'], str):
                    try:
                        graph['vGraph_types'] = json.loads(graph['vGraph_types'])
                    except json.JSONDecodeError:
                        graph['vGraph_types'] = []
                
                if 'vSeries' in graph and isinstance(graph['vSeries'], str):
                    try:
                        graph['vSeries'] = json.loads(graph['vSeries'])
                    except json.JSONDecodeError:
                        graph['vSeries'] = {}
            
            logger.info(f"Retrieved {len(custom_graphs)} custom graphs for machine {machine_name}")
            
            return JsonResponse({
                'status': 'success',
                'message': 'Custom graphs retrieved successfully',
                'data': custom_graphs
            }, status=status.HTTP_200_OK)
        else:
            return JsonResponse({
                'status': 'success',
                'message': 'No custom graphs found',
                'data': []
            }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error retrieving custom graphs: {str(e)}")
        return JsonResponse({
            'status': 'error',
            'message': f'Internal server error: {str(e)}',
            'data': []
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PUT'])
def update_custom_graph(request, graph_id):
    """Update an existing custom graph"""
    try:
        data = request.data
        title = data.get('title', '')
        user_id = data.get('user_id', '')
        add_to_dashboard = data.get('add_to_dashboard', 'N')
        graph_types = data.get('graph_types', [])
        series = data.get('series', {})
        
        # Validation
        if not title:
            return JsonResponse({
                'status': 'error',
                'message': 'Graph title is required',
                'data': {}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not user_id:
            return JsonResponse({
                'status': 'error',
                'message': 'User ID is required',
                'data': {}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if add_to_dashboard not in ['Y', 'N']:
            return JsonResponse({
                'status': 'error',
                'message': 'add_to_dashboard must be either "Y" or "N"',
                'data': {}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not graph_types or len(graph_types) == 0:
            return JsonResponse({
                'status': 'error',
                'message': 'At least one graph type must be selected',
                'data': {}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Convert graph_types and series to JSON strings
        graph_types_json = json.dumps(graph_types)
        series_json = json.dumps(series)
        
        logger.info(f"Updating custom graph {graph_id}: {title}")
        
        # Update in database
        mysql_service = MySQLService()
        success = mysql_service.update_custom_graph(
            graph_id,
            title,
            graph_types_json,
            series_json,
            user_id,
            add_to_dashboard
        )
        
        if success:
            return JsonResponse({
                'status': 'success',
                'message': 'Custom graph updated successfully',
                'data': {'graph_id': graph_id}
            }, status=status.HTTP_200_OK)
        else:
            return JsonResponse({
                'status': 'error',
                'message': 'Failed to update custom graph',
                'data': {}
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    except Exception as e:
        logger.error(f"Error updating custom graph: {str(e)}")
        return JsonResponse({
            'status': 'error',
            'message': f'Internal server error: {str(e)}',
            'data': {}
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['DELETE'])
def delete_custom_graph(request, graph_id):
    """Delete a custom graph"""
    try:
        logger.info(f"Deleting custom graph {graph_id}")
        
        mysql_service = MySQLService()
        success = mysql_service.delete_custom_graph(graph_id)
        
        if success:
            return JsonResponse({
                'status': 'success',
                'message': 'Custom graph deleted successfully',
                'data': {}
            }, status=status.HTTP_200_OK)
        else:
            return JsonResponse({
                'status': 'error',
                'message': 'Custom graph not found or already deleted',
                'data': {}
            }, status=status.HTTP_404_NOT_FOUND)
    
    except Exception as e:
        logger.error(f"Error deleting custom graph: {str(e)}")
        return JsonResponse({
            'status': 'error',
            'message': f'Internal server error: {str(e)}',
            'data': {}
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def get_config_machine_list(request):
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
        
        # Filter out files with '-' in name and remove .json extension
        machine_names = [
            os.path.splitext(f)[0] 
            for f in json_files 
            if '-' not in f
        ]
        
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