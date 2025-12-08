import React, { useState, useEffect, Component } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '../components/layouts/Layout';
import Modal from '../components/Modal';
import Sensors from '../components/dashboard/Sensors';
import DashboardBlock from '../components/dashboard/DashboardBlock';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import { useDashboardData } from '../hooks/useDashboardData';
import { useModalManager } from '../hooks/useModalManager';
import {getUnitByTitle} from '../utils/unitUtils';
import { getFixedColors, getRandomColors} from '../utils/chartUtils';
import apiService from '../services/apiService';
import { PencilSquareIcon, TrashIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const DashboardSummary = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dashboardId = searchParams.get('dashboardId');
  const title = searchParams.get('title');
  const machineName = searchParams.get('machineName'); 
  
  // State for components
  const [components, setComponents] = useState([]);
  const [componentData, setComponentData] = useState({}); // Store chart data per component
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshingComponents, setRefreshingComponents] = useState({}); // Track which components are refreshing
  
  // Determine if this is a new dashboard (has dashboardId)
  const isNewDashboard = dashboardId !== null;

  // Fetch components on mount
  useEffect(() => {
    if (dashboardId) {
      fetchComponents();
    }
  }, [dashboardId]);

  const fetchComponents = async () => {
    try {
      setLoading(true);
      const response = await apiService.getComponents(dashboardId);
      
      if (response.success) {
        setComponents(response.data || response.components || []);
        // Fetch data for each component
        const componentsList = response.data || response.components || [];
        componentsList.forEach(comp => {
          fetchComponentData(comp);
        });
      } else {
        setError(response.error || 'Failed to fetch components');
      }
    } catch (err) {
      console.error('Failed to fetch components:', err);
      setError('Failed to load components');
    } finally {
      setLoading(false);
    }
  };

  const fetchComponentData = async (component) => {
    try {
      const vQuery = component.vQuery;
      
      // Generate data using the saved vQuery
      const response = await apiService.generateData(vQuery, vQuery.machine_name);
      
      if (response.status === 'success') {
        setComponentData(prev => ({
          ...prev,
          [component.icomponent_id]: {
            series: response.data.series,
            chartData: response.data.chartData,
            type: vQuery.type || 'graph',
            unit: response.data.unit,
            statsValue: response.data.statsValue
          }
        }));
      }
    } catch (err) {
      console.error(`Failed to fetch data for component ${component.icomponent_id}:`, err);
    }
  };

  const handleEdit = (component) => {
    navigate(`/component-builder?dashboardId=${dashboardId}&mode=E&component_id=${component.icomponent_id}`);
  };

  const handleDelete = async (component) => {
    if (window.confirm(`Are you sure you want to delete "${component.vTitle}"?`)) {
      try {
        const response = await apiService.deleteComponent(component.icomponent_id);
        if (response.success) {
          // Remove from UI
          setComponents(prev => prev.filter(c => c.icomponent_id !== component.icomponent_id));
          alert('Component deleted successfully');
        } else {
          alert('Failed to delete component: ' + response.error);
        }
      } catch (err) {
        console.error('Failed to delete component:', err);
        alert('Failed to delete component');
      }
    }
  };

  // const handleRefresh = async (component) => {
  //   setRefreshingComponents(prev => ({ ...prev, [component.icomponent_id]: true }));
  //   try {
  //     await fetchComponentData(component);
  //   } finally {
  //     setRefreshingComponents(prev => ({ ...prev, [component.icomponent_id]: false }));
  //   }
  // };

  // Handle create new entry button click
  const handleCreateEntry = () => {
    let componentBuilderUrl = `/component-builder?dashboardId=${encodeURIComponent(dashboardId)}&title=${encodeURIComponent(title)}`;
    if (machineName) {
      componentBuilderUrl += `&machineName=${encodeURIComponent(machineName)}`;
    }
    navigate(componentBuilderUrl);
  };

  // Group components by position for grid layout
  const groupedByPosition = components.reduce((acc, comp) => {
    if (!acc[comp.iPosition]) {
      acc[comp.iPosition] = [];
    }
    acc[comp.iPosition].push(comp);
    return acc;
  }, {});

  return (
    <Layout componentCount={components.length}> 
      <div className="dash-cover p-6 space-y-6">
        {/* Dashboard Header with Add Component Button */}
        <div className="flex justify-end text-right items-center mb-6">
          <button
            onClick={handleCreateEntry}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-md flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Component
          </button>
        </div>
        <div className="">
          {/* Loading State */}
          {loading && components.length === 0 && (
            <LoadingSpinner message="Loading components..." />
          )}

          {/* Error State */}
          {error && (
            <ErrorMessage message={error} />
          )}

          {/* Empty State */}
          {!loading && !error && components.length === 0 && (
            <div className="w-full text-center py-16">
              <div className="inline-block p-8 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <svg 
                  className="w-24 h-24 mx-auto mb-4 text-gray-400 dark:text-gray-600" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" 
                  />
                </svg>
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  No Components Yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  Click "Add Component" to create your first dashboard component
                </p>
              </div>
            </div>
          )}

          {/* Components Grid - Grouped by Position */}
          {!loading && !error && components.length > 0 && (
            <div className="flex flex-wrap gap-4">
              {Object.keys(groupedByPosition)
                .sort((a, b) => parseInt(a) - parseInt(b))
                .map(position => (
                  <div key={position} 
                    className="sub-blocks relative w-[calc(50%-0.5rem)] md:w-[calc(25%-0.75rem)] lg:w-[calc(25%-0.75rem)]"> {/* Adjust width based on type in future */}
                    {groupedByPosition[position].map(component => (
                      <div
                        key={component.icomponent_id}
                        componentType={component.vQuery?.type}
                        // className={`sub-blocks ${
                        //     component.vQuery?.type === 'Graph' ? 'w-full md:w-[calc(33.333%-0.69rem)] lg:w-[calc(33.333%-0.69rem)]' : 
                        //     component.vQuery?.type === 'Stat' ? 'w-[calc(50%-0.5rem)] md:w-[calc(25%-0.75rem)] lg:w-[calc(25%-0.75rem)]' : 
                        //     'w-full md:w-[calc(33.333%-1rem)]'
                        // } mb-4`}
                      >
                        {/* Chart/Stats Display */}
                          {componentData[component.icomponent_id] ? (
                            <DashboardBlock
                              config={{
                                ComponentID: component.icomponent_id,
                                Title: component.vTitle,
                                Description: component.vDescription,
                                Position: component.iPosition, 
                                Series: componentData[component.icomponent_id].series,
                                Units: componentData[component.icomponent_id].unit || '',
                                YAxisDomain: [0, 'auto'],
                                Color: getFixedColors(componentData[component.icomponent_id].series.length)
                              }}
                              initialData={
                                componentData[component.icomponent_id].type?.toLowerCase() === 'stats'
                                  ? [componentData[component.icomponent_id]]
                                  : [componentData[component.icomponent_id].chartData]
                              }
                              selectedType={componentData[component.icomponent_id].type}
                              blockIndex={component.icomponent_id}
                              getUnitByTitle={getUnitByTitle}
                              handleCardClick={() => {}}
                              handleChartClick={() => {}}
                              getRandomColors={getRandomColors}
                              getFixedColors={getFixedColors}
                              isLoading={refreshingComponents[component.icomponent_id]}
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <LoadingSpinner message="Loading data..." />
                            </div>
                          )}

                        {/* Action Buttons */}
                        <div className="flex gap-2 p-0 mb-0 absolute top-1 right-2">
                          <button
                            onClick={() => handleEdit(component)}
                            className="flex items-center justify-center gap-2 px-1 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            title="Edit Component"
                          >
                            <PencilSquareIcon className="w-5 h-5" />
                          </button> 
                          <button
                            onClick={() => handleDelete(component)}
                            className="flex items-center justify-center px-1 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                            title="Delete Component"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default DashboardSummary;
