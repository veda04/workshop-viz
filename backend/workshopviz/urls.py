from django.urls import path
from . import views

urlpatterns = [
    path('test-connection/', views.test_influx_connection, name='test_influx_connection'),
    path('test-mysql/', views.test_mysql_connection, name='test_mysql_connection'),
    path('dashboard-config/', views.get_dashboard_config, name='get_dashboard_config'),
    path('current-booking/', views.get_current_booking, name='get_current_booking'),
]
