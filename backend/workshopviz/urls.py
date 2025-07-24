from django.urls import path
from . import views

urlpatterns = [
    path('test-connection/', views.test_influx_connection, name='test_influx_connection'),
    path('dashboard-config/', views.get_dashboard_config, name='get_dashboard_config'),
]
