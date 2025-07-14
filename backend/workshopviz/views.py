from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.http import JsonResponse
from .influx_service import InfluxDBService
import json
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

# Create your views here.

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
