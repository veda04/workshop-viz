// home page will be the start
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import Modal from '../components/Modal';
import DashboardForm from '../components/forms/CreateDashboardForm';
import DashboardBlock from '../components/dashboard/DashboardBlock';
import { ChartBarIcon } from '@heroicons/react/24/outline';

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

  const handleDashboardSelect = async (dashboardId) => {
    // Find the dashboard to get its details
    const dashboard = dashboards.find(d => d.iDashboard_id === dashboardId);
    
    if (dashboard) {
      // Check if dashboard is machine-specific (MACH) or general (GENR)
      if (dashboard.cCategory === "MACH") {
        try {
          // Get machine name from asset_id if available
          const machinesResponse = await apiService.getMachinesWithConfig();
          let machineName = '';
          
          if (machinesResponse.status === 'success') {
            const machine = machinesResponse.data.find(m => m.iAsset_id === dashboard.iAsset_id);
            machineName = machine ? machine.vName : '';
          }
          
          // Navigate with query parameters including machineName
          navigate(`/dashboard-summary?dashboardId=${dashboardId}&title=${encodeURIComponent(dashboard.vTitle)}&machineName=${encodeURIComponent(machineName)}`);
        } catch (error) {
          console.error('Error fetching machine details:', error);
          // Fallback: navigate with just dashboardId and title
          navigate(`/dashboard-summary?dashboardId=${dashboardId}&title=${encodeURIComponent(dashboard.vTitle)}&machineName=`);
        }
      } else {
        // For GENR category, navigate without machineName
        navigate(`/dashboard-summary?dashboardId=${dashboardId}&title=${encodeURIComponent(dashboard.vTitle)}`);
      }
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
      <div className="min-h-screen flex justify-center items-center bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center">
            <img src="/images/logo.png" alt="Data Analytics for Smart Workshops" className="mx-auto mb-4 h-20" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Workshop Visualisation
            </h1>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Your comprehensive tool for visualizing and analyzing machine data.
            </p>
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
            <div className="text-center pb-12 border border-gray-300 dark:border-gray-700 mb-8 rounded">
              <div className="text-gray-700 dark:text-gray-300 text-lg mb-4 p-1 border-b border-gray-400">
                <p className="text-base">No dashboards available. Create your first dashboard!</p>
              </div>
              <div className="py-10">
                <ChartBarIcon className="w-10 h-10 text-gray-400 mx-auto" />
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:justify-center items-center gap-4 mb-8">
            <button
              onClick={handleCreateNewClick}
              className="bg-blue-500 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-blue-600 transition duration-200"
            >
              Create New Dashboard
            </button>
          </div>

          {!loading && !error && dashboards.length > 0 && (  
            <div className="text-center">
              <div className="relative text-gray-500 dark:text-gray-400 mb-6">
                <p className="relative z-10 bg-gray-200 dark:bg-gray-900 w-8 mx-auto">or</p>
                <hr className="absolute w-full bottom-2 h-1 text-gray-700 dark:text-gray-400" />
              </div>
              <div className="text-center text-base text-gray-500 dark:text-white mb-4">
                Select a dashboard from the dropdown to view it.
              </div>
              <div className="w-96 mx-auto">
                <label htmlFor="dashboard-select" className="sr-only">Select Dashboard</label>
                <select
                  id="dashboard-select"
                  onChange={(e) => {
                  const val = e.target.value;
                  if (val) handleDashboardSelect(Number(val));
                  }}
                  defaultValue=""
                  className="w-full py-3 px-4 border rounded-lg bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-0 focus:ring-indigo-400"
                >
                  <option value="" disabled>
                  -- Select a dashboard --
                  </option>
                  {dashboards.map((dashboard) => {
                  const count = (componentsByDashboard[dashboard.iDashboard_id] || []).length;
                  return (
                    <option key={dashboard.iDashboard_id} value={dashboard.iDashboard_id}>
                    {dashboard.vTitle}
                    </option>
                  );
                  })}
                </select>
              </div>
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
