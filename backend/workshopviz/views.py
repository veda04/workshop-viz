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

logger = logging.getLogger(__name__)

# Create your views here.

# this function loads dashboard config
@api_view(['GET'])
def debug_config_path(request):
    """Debug endpoint to check config file path"""
    try:
        from django.conf import settings
        import os
        
        config_path = os.path.join(settings.BASE_DIR, 'config', 'HurcoDashboard2.json')
        alt_config_path = os.path.join(os.path.dirname(__file__), '..', 'config', 'HurcoDashboard2.json')
        
        debug_info = {
            'BASE_DIR': str(settings.BASE_DIR),
            'config_path': config_path,
            'config_exists': os.path.exists(config_path),
            'alt_config_path': alt_config_path,
            'alt_config_exists': os.path.exists(alt_config_path),
            'current_dir': os.path.dirname(__file__),
            'files_in_current_dir': os.listdir(os.path.dirname(__file__)),
        }
        
        # Check what files exist in the config directory
        config_dir = os.path.join(settings.BASE_DIR, 'config')
        if os.path.exists(config_dir):
            debug_info['files_in_config_dir'] = os.listdir(config_dir)
        else:
            debug_info['files_in_config_dir'] = 'Config directory does not exist'
            
        # Check parent directory
        parent_dir = os.path.join(os.path.dirname(__file__), '..')
        if os.path.exists(parent_dir):
            debug_info['files_in_parent_dir'] = os.listdir(parent_dir)
        
        return Response({
            'status': 'debug',
            'data': debug_info
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'status': 'error',
            'message': f'Debug error: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# this function loads dashboard config
def load_dashboard_config():
    """Load dashboard configuration from JSON file"""
    try:
        # Use the path that we know works from debug
        config_path = os.path.join(settings.BASE_DIR, 'config', 'HurcoDashboard2.json')
        
        # Add debug logging to see the actual path
        logger.info(f"Looking for config file at: {config_path}")
        
        if not os.path.exists(config_path):
            logger.error(f"File does not exist at: {config_path}")
            # Try alternative path
            alt_config_path = os.path.join(os.path.dirname(__file__), '..', 'config', 'HurcoDashboard2.json')
            logger.info(f"Trying alternative path: {alt_config_path}")
            if os.path.exists(alt_config_path):
                config_path = alt_config_path
            else:
                logger.error(f"Alternative path also not found: {alt_config_path}")
                return {}
        
        with open(config_path, 'r', encoding='utf-8') as file:
            config_data = json.load(file)
            logger.info(f"Successfully loaded config with {len(config_data)} items")
            return config_data
            
    except FileNotFoundError:
        logger.error(f"Dashboard config file not found at {config_path}")
        return {}
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in dashboard config: {e}")
        return {}
    except Exception as e:
        logger.error(f"Error loading dashboard config: {e}")
        return {}

    
@api_view(['GET'])
def get_dashboard_config(request):
    """API endpoint to retrieve dashboard configuration with executed query data"""
    try:
        config = load_dashboard_config()
        if not config:
            return Response({
                'status': 'error',
                'message': 'Dashboard configuration not found or invalid'
            }, status=status.HTTP_404_NOT_FOUND)

        # Get time range parameters from request
        time_range = request.GET.get('range', '3h')  # Default to 3h
        
        # Initialize InfluxDB service
        influx_service = InfluxDBService()
        
        # Process each widget in the configuration
        processed_config = {}
        for widget_id, widget_config in config.items():
        #     # Copy all original configuration
            processed_widget = widget_config.copy()
            print(processed_widget)
            
        #     # If widget has queries, execute them
        #     if 'Queries' in widget_config and widget_config['Queries']:
        #         query_results = []
                
        #         for query_info in widget_config['Queries']:
        #             if 'Flux' in query_info:
        #                 try:
        #                     # Replace time range variables in the query
        #                     flux_query = query_info['Flux']
        #                     # You might need to replace v.timeRangeStart, v.timeRangeStop, v.windowPeriod
        #                     # based on your InfluxDB service implementation
                            
        #                     # Execute the query
        #                     result = influx_service.execute_flux_query(
        #                         query=flux_query,
        #                         time_range=time_range
        #                     )
                            
        #                     if result['status'] == 'success':
        #                         query_result = {
        #                             'units': query_info.get('Units', ''),
        #                             'pivot': query_info.get('Pivot', ''),
        #                             'data': result.get('data', []),
        #                             'query': flux_query
        #                         }
        #                     else:
        #                         query_result = {
        #                             'units': query_info.get('Units', ''),
        #                             'pivot': query_info.get('Pivot', ''),
        #                             'data': [],
        #                             'error': result.get('message', 'Query execution failed'),
        #                             'query': flux_query
        #                         }
                            
        #                     query_results.append(query_result)
                            
        #                     return Response({
        #                         'status': 'error',
        #                         'results': query_results
        #                     }, status=status.HTTP_404_NOT_FOUND)
                        
        #                 except Exception as query_error:
        #                     logger.error(f"Error executing query for widget {widget_id}: {str(query_error)}")
        #                     query_results.append({
        #                         'units': query_info.get('Units', ''),
        #                         'pivot': query_info.get('Pivot', ''),
        #                         'data': [],
        #                         'error': str(query_error),
        #                         'query': query_info.get('Flux', '')
        #                     })
                
        #         # Add query results to the widget configuration
        #         processed_widget['QueryResults'] = query_results
            
        #     processed_config[widget_id] = processed_widget
        
        # # Close InfluxDB connection
        # influx_service.close()
        
        # return Response({
        #     'status': 'success',
        #     'data': processed_config,
        #     'metadata': {
        #         'total_widgets': len(processed_config),
        #         'time_range': time_range,
        #         'timestamp': datetime.now().isoformat()
        #     }
        # }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error retrieving dashboard config: {str(e)}")
        return Response({
            'status': 'error',
            'message': f'Internal server error: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def get_widget_config(request, widget_id):
    """API endpoint to retrieve specific widget configuration"""
    try:
        config = load_dashboard_config()
        widget = config.get(widget_id)
        
        if widget:
            return Response({
                'status': 'success',
                'data': widget
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'status': 'error',
                'message': f'Widget {widget_id} not found'
            }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error retrieving widget config: {str(e)}")
        return Response({
            'status': 'error',
            'message': f'Internal server error: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def test_influx_connection(request):
    """Test API endpoint to check InfluxDB connection"""
    try:
        influx_service = InfluxDBService()
        result = influx_service.test_connection()
        influx_service.close()
        
        if result['status'] == 'success':
            return Response(result, status=status.HTTP_200_OK)
        else:
            return Response(result, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    except Exception as e:
        logger.error(f"Error testing InfluxDB connection: {str(e)}")
        return Response({
            'status': 'error',
            'message': f'Internal server error: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def get_machine_data(request):
    """API endpoint to retrieve machine sensor data"""
    try:
        machine_id = request.GET.get('machine_id')
        limit = int(request.GET.get('limit', 100))
        
        influx_service = InfluxDBService()
        result = influx_service.get_machine_data(machine_id=machine_id, limit=limit)
        influx_service.close()
        
        if result['status'] == 'success':
            return Response(result, status=status.HTTP_200_OK)
        else:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        logger.error(f"Error retrieving machine data: {str(e)}")
        return Response({
            'status': 'error',
            'message': f'Internal server error: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def get_machine_summary(request):
    """API endpoint to retrieve machine summary data"""
    try:
        machine_id = request.GET.get('machine_id')
        
        influx_service = InfluxDBService()
        result = influx_service.get_machine_summary(machine_id=machine_id)
        influx_service.close()
        
        if result['status'] == 'success':
            return Response(result, status=status.HTTP_200_OK)
        else:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        logger.error(f"Error retrieving machine summary: {str(e)}")
        return Response({
            'status': 'error',
            'message': f'Internal server error: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def health_check(request):
    """Simple health check endpoint"""
    return Response({
        'status': 'success',
        'message': 'Django API is running',
        'timestamp': datetime.now().isoformat()
    }, status=status.HTTP_200_OK)
