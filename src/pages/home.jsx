// home page will be the start
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import Modal from '../components/Modal';
import DashboardForm from '../components/forms/CreateDashboardForm';
import DashboardBlock from '../components/dashboard/DashboardBlock';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const Home = () => {
  const [dashboards, setDashboards] = useState([]);
  const [allComponents, setAllComponents] = useState([]);
  const [componentData, setComponentData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [isEnlargedModalOpen, setIsEnlargedModalOpen] = useState(false);
  const navigate = useNavigate();

  // Fetch dashboards and their components on mount
  useEffect(() => {
    fetchDashboardsAndComponents();
  }, []);

  const fetchDashboardsAndComponents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all dashboards
      const dashboardsResponse = await apiService.getDashboards();
      if (dashboardsResponse.success) {
        setDashboards(dashboardsResponse.data);
        
        // Fetch components for all dashboards
        const componentsPromises = dashboardsResponse.data.map(dashboard =>
          apiService.getComponents(dashboard.iDashboard_id)
        );
        
        const componentsResponses = await Promise.all(componentsPromises);
        
        // Flatten all components
        const allComponentsArray = componentsResponses.flatMap(response =>
          response.success ? response.data : []
        );
        
        setAllComponents(allComponentsArray);
        
        // Fetch data for each component
        await fetchAllComponentData(allComponentsArray);
      } else {
        setError(dashboardsResponse.error || 'Failed to fetch dashboards');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboards and components');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllComponentData = async (components) => {
    const dataPromises = components.map(async (component) => {
      try {
        const vQuery = component.vQuery;
        const machineName = vQuery.machine_names?.[0] || '';
        
        const response = await apiService.generateData(vQuery, machineName);
        
        return {
          id: component.icomponent_id,
          data: response.data,
          type: vQuery.type
        };
      } catch (error) {
        console.error(`Error fetching data for component ${component.icomponent_id}:`, error);
        return {
          id: component.icomponent_id,
          data: null,
          type: component.vQuery.type,
          error: error.message
        };
      }
    });
    
    const dataResults = await Promise.all(dataPromises);
    
    // Convert array to object keyed by component id
    const dataMap = {};
    dataResults.forEach(result => {
      dataMap[result.id] = result;
    });
    
    setComponentData(dataMap);
  };

  const handleDashboardSelect = (dashboardId) => {
    // Find the dashboard to get its details
    const dashboard = dashboards.find(d => d.iDashboard_id === dashboardId);
    if (dashboard) {
      // Navigate with query parameters (title and machineName will be fetched by DashboardSummary)
      navigate(`/dashboard-summary?dashboardId=${dashboardId}&title=${encodeURIComponent(dashboard.vTitle)}&machineName=`);
    } else {
      navigate(`/dashboard-summary?dashboardId=${dashboardId}&title=Dashboard&machineName=`);
    }
  };

  const handleCreateNewClick = () => {
    setIsCreateModalOpen(true);
  };

  const handleModalClose = () => {
    setIsCreateModalOpen(false);
  };

  const handleComponentClick = (component) => {
    setSelectedComponent(component);
    setIsEnlargedModalOpen(true);
  };

  const handleEnlargedModalClose = () => {
    setIsEnlargedModalOpen(false);
    setSelectedComponent(null);
  };

  const handleEditComponent = (e, component) => {
    e.stopPropagation(); // Prevent card click
    navigate(`/component-builder?dashboardId=${component.iDashboard_id}&mode=E&component_id=${component.icomponent_id}`);
  };

  const handleDeleteComponent = async (e, component) => {
    e.stopPropagation(); // Prevent card click
    
    if (window.confirm(`Are you sure you want to delete "${component.vTitle}"?`)) {
      try {
        const response = await apiService.deleteComponent(component.icomponent_id);
        if (response.success) {
          // Refresh the component list
          fetchDashboardsAndComponents();
        } else {
          alert(`Failed to delete component: ${response.error}`);
        }
      } catch (error) {
        alert(`Error deleting component: ${error.message}`);
      }
    }
  };

  // Group components by dashboard
  const componentsByDashboard = allComponents.reduce((acc, component) => {
    const dashboardId = component.iDashboard_id;
    if (!acc[dashboardId]) {
      acc[dashboardId] = [];
    }
    acc[dashboardId].push(component);
    return acc;
  }, {});

return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Workshop Visualisation
            </h1>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Your comprehensive tool for visualizing and analyzing machine data.
            </p>
            <button
              onClick={handleCreateNewClick}
              className="bg-blue-500 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-blue-600 transition duration-200"
            >
              Create New Dashboard
            </button>
          </div>

          {loading && (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner message="Loading dashboards and components..." />
            </div>
          )}

          {error && (
            <div className="max-w-2xl mx-auto">
              <ErrorMessage message={error} />
            </div>
          )}

          {!loading && !error && dashboards.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-700 dark:text-gray-300 text-lg mb-4">
                No dashboards available. Create your first dashboard!
              </p>
            </div>
          )}

          {!loading && !error && dashboards.length > 0 && (
            <div className="space-y-8">
              {dashboards.map((dashboard) => {
                const dashboardComponents = componentsByDashboard[dashboard.iDashboard_id] || [];
                
                return (
                  <div key={dashboard.iDashboard_id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                    {/* Dashboard Header */}
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                          {dashboard.vTitle}
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {dashboardComponents.length} component{dashboardComponents.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDashboardSelect(dashboard.iDashboard_id)}
                        className="bg-indigo-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-600 transition duration-200"
                      >
                        View Dashboard
                      </button>
                    </div>

                    {/* Component Cards */}
                    {dashboardComponents.length === 0 ? (
                      <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                        No components in this dashboard yet.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {dashboardComponents.map((component) => {
                          const compData = componentData[component.icomponent_id];
                          
                          return (
                            <div
                              key={component.icomponent_id}
                              onClick={() => handleComponentClick(component)}
                              className="relative bg-gray-50 dark:bg-gray-700 rounded-lg p-4 shadow hover:shadow-lg transition-all duration-200 cursor-pointer border-2 border-transparent hover:border-blue-500"
                            >
                              {/* Action Icons */}
                              <div className="absolute top-2 right-2 flex space-x-2 z-10">
                                <button
                                  onClick={(e) => handleEditComponent(e, component)}
                                  className="p-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
                                  title="Edit Component"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={(e) => handleDeleteComponent(e, component)}
                                  className="p-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
                                  title="Delete Component"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>

                              {/* Component Title */}
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 pr-20">
                                {component.vTitle}
                              </h3>

                              {/* Component Description */}
                              {component.vDescription && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                                  {component.vDescription}
                                </p>
                              )}

                              {/* Mini Preview */}
                              <div className="h-32 bg-white dark:bg-gray-600 rounded overflow-hidden">
                                {compData ? (
                                  <div className="transform scale-50 origin-top-left w-[200%] h-[200%]">
                                    <DashboardBlock
                                      data={compData.type?.toLowerCase() === 'stats' ? compData.data : { data: compData.data }}
                                      type={compData.type}
                                      isLoading={false}
                                    />
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center h-full">
                                    <LoadingSpinner message="" />
                                  </div>
                                )}
                              </div>

                              {/* Position Badge */}
                              <div className="mt-2 inline-block bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-xs font-semibold px-2 py-1 rounded">
                                Position {component.iPosition}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create Dashboard Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={handleModalClose} size="default">
        <DashboardForm onClose={handleModalClose} />
      </Modal>

      {/* Enlarged Component Modal */}
      {selectedComponent && (
        <Modal isOpen={isEnlargedModalOpen} onClose={handleEnlargedModalClose} size="large">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {selectedComponent.vTitle}
            </h2>
            {selectedComponent.vDescription && (
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {selectedComponent.vDescription}
              </p>
            )}
            <div className="min-h-[400px]">
              {componentData[selectedComponent.icomponent_id] ? (
                <DashboardBlock
                  data={
                    componentData[selectedComponent.icomponent_id].type?.toLowerCase() === 'stats'
                      ? componentData[selectedComponent.icomponent_id].data
                      : { data: componentData[selectedComponent.icomponent_id].data }
                  }
                  type={componentData[selectedComponent.icomponent_id].type}
                  isLoading={false}
                />
              ) : (
                <LoadingSpinner message="Loading component data..." />
              )}
            </div>
          </div>
        </Modal>
      )}
    </>
);
};

export default Home;
