from django.urls import path
from . import views

urlpatterns = [
    path('test-influx-connection/', views.test_influx_connection, name='test_influx_connection'),
    path('test-mysql-connection/', views.test_mysql_connection, name='test_mysql_connection'),
    path('dashboard-config/', views.get_dashboard_config, name='get_dashboard_config'),
    path('current-booking/', views.get_current_booking, name='get_current_booking'),
    path('user-list/', views.get_user_list, name='get_user_list'),
    path('add-notes/', views.add_notes, name='add_notes'),
    path('graph-configurations/', views.get_graph_configurations, name='get_graph_configurations'),
    path('custom-graph-data/', views.custom_graph_data, name='custom_graph_data'),
    path('available-series/', views.get_available_series, name='get_available_series'),
    path('save-custom-graph/', views.save_custom_graph, name='save_custom_graph'),
    path('get-custom-graphs/', views.get_custom_graphs, name='get_custom_graphs'),
    path('update-custom-graph/<int:graph_id>/', views.update_custom_graph, name='update_custom_graph'),
    path('delete-custom-graph/<int:graph_id>/', views.delete_custom_graph, name='delete_custom_graph'),
    path('config-machine-list/', views.get_config_machine_list, name='get_config_machine_list'),
]