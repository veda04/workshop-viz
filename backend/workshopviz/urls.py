from django.urls import path
from . import views

urlpatterns = [
    path('health/', views.health_check, name='health_check'),
    path('test-connection/', views.test_influx_connection, name='test_influx_connection'),
    path('machine-data/', views.get_machine_data, name='get_machine_data'),
    path('machine-summary/', views.get_machine_summary, name='get_machine_summary'),

    path('dashboard-config/', views.get_dashboard_config, name='get_dashboard_config'),
    path('widget-config/<str:widget_id>/', views.get_widget_config, name='get_widget_config'),
     path('debug-config-path/', views.debug_config_path, name='debug_config_path'),
]
