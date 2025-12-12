import React, { useState, useEffect, Component } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '../components/layouts/Layout';
import Modal from '../components/Modal';
import Sensors from '../components/dashboard/Sensors';
import DashboardBlock from '../components/dashboard/DashboardBlock';
import ZoomableChart from '../components/charts/ZoomableChart';
import ZoomableCard from '../components/cards/ZoomableCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import { useDashboardData } from '../hooks/useDashboardData';
import { useEditLayout } from '../context/EditLayoutContext';
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
  const { isEditMode } = useEditLayout();
  
  // State for components
  const [components, setComponents] = useState([]);
  const [componentData, setComponentData] = useState({}); // Store chart data per component
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshingComponents, setRefreshingComponents] = useState({}); // Track which components are refreshing
  
  // Modal state for enlarged chart view
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const [selectedChartData, setSelectedChartData] = useState(null);
  
  // Modal state for enlarged stat card view
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [selectedCardData, setSelectedCardData] = useState(null);
  
  // Determine if this is a new dashboard (has dashboardId)
  const isNewDashboard = dashboardId !== null;

  // rest layout logic here
  const resetLayout = () => {};

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
        const componentsList = response.data || response.components || [];
        setComponents(componentsList);
        
        // Fetch data for all components and wait for all to complete
        await Promise.all(
          componentsList.map(comp => fetchComponentData(comp))
        );
      } else {
        setError(response.error || 'Failed to fetch components');
      }
    } catch (err) {
      console.error('Failed to fetch components:', err);
      setError('Failed to load components, please try again later.');
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
        console.log('DashboardSummary - Response from backend:', response.data);
        console.log('DashboardSummary - vQuery:', vQuery);
        
        // Reconstruct axisConfig from the saved vQuery if not provided by backend
        // This ensures proper left/right axis positioning for multiple data types
        let axisConfig = response.data.axisConfig;
        
        if (!axisConfig && vQuery.graphs && vQuery.graphs.length > 0) {
          // Fetch data type configs to get unit information
          const dataTypeConfigs = await Promise.all(
            vQuery.machine_names.map(async (machineName, index) => {
              try {
                const configResponse = await apiService.getDataTypes(machineName);
                if (configResponse.status === 'success') {
                  const graphId = vQuery.graphs[index];
                  return {
                    config: configResponse.data.find(dt => dt.id === graphId),
                    machineName: machineName,
                    graphId: graphId,
                    series: vQuery.series[graphId] || []
                  };
                }
                return null;
              } catch (err) {
                console.error(`Failed to fetch config for ${machineName}:`, err);
                return null;
              }
            })
          );
          
          // Build axisConfig similar to useComponentBuilderData.js
          axisConfig = dataTypeConfigs
            .filter(item => item !== null)
            .map((item, index) => ({
              graphId: item.graphId,
              machineName: item.machineName,
              position: index === 0 ? 'left' : 'right',
              unit: item.config?.unit || '',
              title: item.config?.title || '',
              series: item.series
            }));
          console.log('DashboardSummary - Reconstructed axisConfig:', axisConfig);
        } else {
          console.log('DashboardSummary - Using backend axisConfig:', axisConfig);
        }
        
        setComponentData(prev => ({
          ...prev,
          [component.icomponent_id]: {
            series: response.data.series,
            chartData: response.data.chartData,
            type: vQuery.type || 'graph',
            unit: response.data.unit,
            statsValue: response.data.statsValue,
            axisConfig: axisConfig
          }
        }));
      }
    } catch (err) {
      console.error(`Failed to fetch data for component ${component.icomponent_id}:`, err);
    }
  };

  const handleEdit = (component) => {
    let editUrl = `/component-builder?dashboardId=${dashboardId}&title=${encodeURIComponent(title)}&mode=E&component_id=${component.icomponent_id}`;
    if (machineName) {
      editUrl += `&machineName=${encodeURIComponent(machineName)}`;
    }
    // Pass hasComponents flag to indicate dashboard has components
    if (components.length > 0) {
      editUrl += `&hasComponents=true`;
    }
    navigate(editUrl);
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

  // Handle chart click to open modal with enlarged view
  const handleChartClick = (component) => {
    const data = componentData[component.icomponent_id];
    if (!data || !data.chartData || data.chartData.length === 0) return;
    
    setSelectedChartData({
      chartData: data.chartData,
      series: data.series,
      unit: data.unit,
      title: component.vTitle,
      color: getFixedColors(data.series.length),
      axisConfig: data.axisConfig
    });
    setIsChartModalOpen(true);
  };

  // Handle card click to open modal with enlarged stat view
  const handleCardClick = (component) => {
    const data = componentData[component.icomponent_id];
    if (!data) return;
    
    setSelectedCardData({
      title: component.vTitle,
      value: data.statsValue,
      unit: data.unit,
      description: component.vDescription
    });
    setIsCardModalOpen(true);
  };

  // Handle create new entry button click
  const handleCreateEntry = () => {
    let componentBuilderUrl = `/component-builder?dashboardId=${encodeURIComponent(dashboardId)}&title=${encodeURIComponent(title)}`;
    if (machineName) {
      componentBuilderUrl += `&machineName=${encodeURIComponent(machineName)}`;
    }
    // Pass hasComponents flag to indicate dashboard has components
    if (components.length > 0) {
      componentBuilderUrl += `&hasComponents=true`;
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
      <div className={`dash-cover p-6 space-y-6 ${!machineName && components.length !== 0 ? 'no-machine-associated' : ''}`}>
        <div className={`mb-4 flex items-center ${isEditMode ? 'justify-between' : 'justify-end'}`}>
          {isEditMode && (
            <div className="w-89 py-1 px-2 bg-purple-100 dark:bg-purple-200 border-2 border-purple-300 dark:border-purple-300 rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-purple-800 dark:text-purple-800 font-semibold">
                  Edit Layout Mode Active : Drag and resize blocks to re-arrange your dashboard components | Click "Add Component" to add more components.
                </p>
                <button
                  onClick={resetLayout}
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors shadow-md"
                  title="Reset to original layout"
                >
                  Reset Layout
                </button>
              </div>
            </div>
          )}
          {/* Add Component Button */}
          {(components.length === 0 || isEditMode) && (
          <div className="">
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
          )}
        </div>
        <div className="">
          {/* Loading State */}
          {loading && (
            <LoadingSpinner message="Loading dashboard components..." />
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
                        {/* Chart/Stat Display */}
                        <DashboardBlock
                          config={{
                            ComponentID: component.icomponent_id,
                            Title: component.vTitle,
                            Description: component.vDescription,
                            Position: component.iPosition, 
                            Series: componentData[component.icomponent_id]?.series || [],
                            Units: componentData[component.icomponent_id]?.unit || '',
                            YAxisDomain: [0, 'auto'],
                            Color: getFixedColors(componentData[component.icomponent_id]?.series?.length || 0)
                          }}
                          initialData={
                            componentData[component.icomponent_id]?.type?.toLowerCase() === 'stat'
                              ? [componentData[component.icomponent_id]]
                              : [componentData[component.icomponent_id]?.chartData || []]
                          }
                          selectedType={componentData[component.icomponent_id]?.type}
                          axisConfig={componentData[component.icomponent_id]?.axisConfig}
                          blockIndex={component.icomponent_id}
                          getUnitByTitle={getUnitByTitle}
                          handleCardClick={() => handleCardClick(component)}
                          handleChartClick={() => handleChartClick(component)}
                          getRandomColors={getRandomColors}
                          getFixedColors={getFixedColors}
                          isLoading={refreshingComponents[component.icomponent_id]}
                        />

                        {/* Action Buttons */}
                        {isEditMode && (
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
                        )}
                      </div>
                    ))}
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal for Enlarged Chart View */}
      <Modal isOpen={isChartModalOpen} onClose={() => setIsChartModalOpen(false)} size="full">
        {selectedChartData && (
          <ZoomableChart
            data={selectedChartData.chartData}
            series={selectedChartData.series}
            color={selectedChartData.color}
            title={selectedChartData.title}
            unit={selectedChartData.unit || getUnitByTitle(selectedChartData.title || '')}
            axisConfig={selectedChartData.axisConfig}
          />
        )}
      </Modal>

      {/* Modal for Enlarged Stat Card View */}
      <Modal isOpen={isCardModalOpen} onClose={() => setIsCardModalOpen(false)}>
        {selectedCardData && (
          <ZoomableCard
            title={selectedCardData.title}
            value={selectedCardData.value}
            unit={selectedCardData.unit || getUnitByTitle(selectedCardData.title || '')}
            description={selectedCardData.description}
          />          
        )}
      </Modal>

      
    </Layout>
  );
};

export default DashboardSummary;
