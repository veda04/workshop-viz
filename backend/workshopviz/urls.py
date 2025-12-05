from django.urls import path
from . import views

urlpatterns = [
    path('test-influx-connection/', views.test_influx_connection, name='test_influx_connection'),
    path('test-mysql-connection/', views.test_mysql_connection, name='test_mysql_connection'),
    # path('dashboard-config/', views.get_dashboard_config, name='get_dashboard_config'),

    path('current-booking/', views.get_current_booking, name='get_current_booking'),
    path('user-list/', views.get_user_list, name='get_user_list'),
    path('add-notes/', views.add_notes, name='add_notes'),

    path('machines-with-config/', views.get_machines_with_config, name='get_machines_with_config'),
    path('dropdowns-from-config/', views.get_dropdowns_from_config, name='get_dropdowns_from_config'),
    path('create-dashboard/', views.create_dashboard, name='create_dashboard'),

    path('data-types/', views.get_data_types, name='get_data_types'),
    path('available-series/', views.get_available_series, name='get_available_series'),
    path('generate-data/', views.generate_data, name='generate_data'),
    
    # Dashboard endpoints
    path('dashboards/', views.list_dashboards, name='list_dashboards'),
    
    # Component CRUD endpoints
    path('components/create/', views.create_component, name='create_component'),
    path('components/', views.list_components, name='list_components'),
    path('components/<int:component_id>/', views.get_component, name='get_component'),
    path('components/<int:component_id>/update/', views.update_component, name='update_component'),
    path('components/<int:component_id>/delete/', views.delete_component, name='delete_component'),
]