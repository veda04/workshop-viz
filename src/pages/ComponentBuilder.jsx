import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '../components/layouts/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import ZoomableChart from '../components/charts/ZoomableChart';
import DashboardBlock from '../components/dashboard/DashboardBlock';
import Modal from '../components/Modal';
import AddComponentForm from '../components/forms/AddComponentForm';
import { useComponentBuilderData } from '../hooks/useComponentBuilderData';
import { getFixedColors, getRandomColors } from '../utils/chartUtils';
import { getUnitByTitle } from '../utils/unitUtils';
import apiService from '../services/apiService';

const ComponentBuilder = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const machineName = searchParams.get('machineName');
  const dashboardId = searchParams.get('dashboardId');
  const mode = searchParams.get('mode'); // 'E' for edit mode
  const componentId = searchParams.get('component_id');
  const isEditMode = mode === 'E' && componentId;
  const hasComponents = searchParams.get('hasComponents') === 'true'; // Check if coming from dashboard with components
  
  // Use custom hook for graph data management
  const {
    graphConfigs,
    machines,
    dropdowns,
    machineDataTypes,
    graphToMachineMap,
    selectedGraphs,
    availableSeries,
    hasPivotMap,
    selectedSeries,
    graphData,
    timeRange,
    loading,
    loadingSeries,
    loadingDataTypes,
    generatingGraph,
    error,
    savedGraphs,
    loadingSavedGraphs,
    setTimeRange,
    handleGraphSelection,
    handleSeriesSelection,
    generateGraph,
    clearError,
    loadSavedGraph,
    refreshSavedGraphs,
    selectedType,
    setSelectedType,
    selectedAggregate,
    setSelectedAggregate,
    fetchDataTypesForMachine
  } = useComponentBuilderData(machineName);

  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const [isSaveGraphModalOpen, setIsSaveGraphModalOpen] = useState(false);
  const [isAddToDashboardModalOpen, setIsAddToDashboardModalOpen] = useState(false);
  const [saveableConfig, setSaveableConfig] = useState(null);
  const [componentToEdit, setComponentToEdit] = useState(null);
  const [chartColors, setChartColors] = useState([]);
  const [isAccordionOpen, setIsAccordionOpen] = useState(true); // Start collapsed for consistency
  const [expandedMachines, setExpandedMachines] = useState([]);
  const [editGraphId, setEditGraphId] = useState(null);
  const [editGraphData, setEditGraphData] = useState(null);
  const custom_types = ['Graph', 'Stat'];
  const aggregates = ['Max', 'Min', 'Mean'];

  // Handle chart click to open modal with ZoomableChart
  const handleChartClick = () => {
    if (!graphData || !graphData.chartData || graphData.chartData.length === 0) return;
    setIsChartModalOpen(true);
  };

  // Generate colors when graph data changes
  useEffect(() => {
    if (graphData && graphData.series) {
      const numSeries = graphData.series.length;
      const colors = getFixedColors(numSeries);
      setChartColors(colors);
    }
  }, [graphData]);

  // Load component data in edit mode
  useEffect(() => {
    if (isEditMode && componentId) {
      loadComponentForEdit(componentId);
    }
  }, [isEditMode, componentId]);

  const loadComponentForEdit = async (compId) => {
    try {
      const response = await apiService.getComponent(compId);
      if (response.success) {
        const component = response.data || response.component;
        setComponentToEdit(component);
        const vQuery = component.vQuery;
        
        // TODO: Pre-populate form fields from vQuery
        // This would involve setting machines, data types, series selections, etc.
        // For now, just store the component data
        console.log('Component loaded for edit:', component);
      }
    } catch (error) {
      console.error('Failed to load component:', error);
      alert('Failed to load component for editing');
    }
  };

  // Handle generate graph button click
  const handleGenerateGraph = async () => {
    const success = await generateGraph();
    if (success) {
      setIsAccordionOpen(false); // Collapse accordion after successful generation
    }
  };

  // Update saveableConfig whenever graphData changes
  useEffect(() => {
    if (graphData?.saveableConfig) {
      //console.log('Setting saveableConfig:', graphData.saveableConfig);
      setSaveableConfig(graphData.saveableConfig);
    }
  }, [graphData]);

  // Handle Add to Dashboard button click
  const handleSaveGraph = () => {
    if (!graphData || !graphData.chartData || graphData.chartData.length === 0) {
      alert('Please generate a graph first');
      return;
    }
    
    // Check if we have saveableConfig
    if (!saveableConfig) {
      alert('Configuration data is missing. Please generate the graph again.');
      return;
    }
    
    // Check if we have dashboard context
    if (!dashboardId) {
      alert('Dashboard ID is missing. Please access this page through a dashboard.');
      return;
    }
    
    setIsAddToDashboardModalOpen(true);
  };

  // Handle machine accordion toggle
  const toggleMachine = async (machine) => {
    if (expandedMachines.includes(machine)) {
      // Collapse - remove from expanded list
      setExpandedMachines(expandedMachines.filter(m => m !== machine));
    } else {
      // Expand - add to list and fetch data types if not already loaded
      setExpandedMachines([...expandedMachines, machine]);
      await fetchDataTypesForMachine(machine);
    }
  };

  // Handle saved graph card click
  const handleSavedGraphClick = async (savedGraph) => {
    // Expand accordion if collapsed
    setIsAccordionOpen(true);
    
    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Set edit context
    setEditGraphId(savedGraph.iGraph_id);
    setEditGraphData(savedGraph);
    
    // Load the saved graph configuration
    await loadSavedGraph(savedGraph);
  };

  // Handle delete graph
  const handleDeleteGraph = async (graphId) => {
    try {
      const apiService = (await import('../services/apiService')).default;
      const result = await apiService.deleteCustomGraph(graphId);
      
      if (result.status === 'success') {
        // Clear edit mode if deleted graph was being edited
        if (editGraphId === graphId) {
          setEditGraphId(null);
          setEditGraphData(null);
        }
        // Refresh the saved graphs list
        refreshSavedGraphs();
      } else {
        alert('Failed to delete graph: ' + result.message);
      }
    } catch (error) {
      console.error('Error deleting graph:', error);
      alert('Failed to delete graph');
    }
  };

  // Handle successful save - refresh the list
  const handleSaveSuccess = (message) => {
    // Clear edit mode when successfully saved
    setEditGraphId(null);
    setEditGraphData(null);
    refreshSavedGraphs();
    setIsSaveGraphModalOpen(false);
  };

  if (loading) {
    return (
      <Layout componentCount={hasComponents ? 1 : 0}>
        <div className="flex justify-center items-center min-h-screen">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  return (
    <Layout componentCount={hasComponents ? 1 : 0}> 
      <div className={`dash-cover mx-auto px-4 sm:px-6 lg:px-8 py-8 ${!machineName ? 'no-machine-associated' : ''}`}> {/* max-w-7xl */}
        <div className="mt-0 mb-8">
          <h2 className="text-3xl text-gray-900 capitalize dark:text-white mb-2">
            Customize your dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Select up to 2 data types of a single machine or 1 data type each for multiple machines and their series to generate a custom visualization.
          </p>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorMessage message={error} onDismiss={clearError} padding="py-2" />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
          {/* Left Panel - Graph Selection */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              {/* Select Type Block start */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Select Type
                </h2>
                <div className="space-y-3">
                  <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-4 py-2 font-base rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 
                  dark:text-white focus:ring-2 focus:ring-blue-600"
                  >
                  {custom_types.map((type) => (
                    <option key={type} value={type} className="capitalize">
                    {type}
                    </option>
                  ))}
                  </select>
                </div>
              </div>
              {/* Select Type block end */}

              {/* Collapsible Machine/Data Types Section */}
              <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl capitalize font-semibold text-gray-900 dark:text-white">
                    Select data types
                  </h2>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    ({selectedGraphs.length}/{selectedType === 'Stat' ? '1' : '2'})
                  </span>
                </div>

                {/* MACH Dashboard - Single Machine with nested accordion structure */}                
                {machineName && (
                  <div className="space-y-3">
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                      {/* Machine Accordion Header */}
                      <button
                        onClick={() => toggleMachine(machineName)}
                        className="w-full px-4 py-3 flex items-center justify-between text-left bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {machineName}
                        </h4>
                        <svg
                          className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${
                            expandedMachines.includes(machineName) ? 'transform rotate-180' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {/* Machine Data Types Content */}
                      <div
                        className={`transition-all duration-300 ease-in-out ${
                          expandedMachines.includes(machineName) ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
                        } overflow-hidden`}
                      >
                        <div className="p-3 space-y-2">
                          {loading && (
                            <div className="flex justify-center items-center py-4">
                              <LoadingSpinner />
                            </div>
                          )}
                          
                          {!loading && graphConfigs.length === 0 && (
                            <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                              No data types available
                            </p>
                          )}

                          {!loading && graphConfigs.map((datatypes) => {
                            const maxSelection = selectedType === 'Stat' ? 1 : 2;
                            return (
                              <div
                                key={datatypes.id}
                                className={`p-3 rounded-lg border-2 transition-all ${
                                  selectedGraphs.includes(datatypes.id)
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                } ${selectedGraphs.length >= maxSelection && !selectedGraphs.includes(datatypes.id) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                onClick={() => {
                                  if (selectedGraphs.length < maxSelection || selectedGraphs.includes(datatypes.id)) {
                                    handleGraphSelection(datatypes.id, machineName);
                                  }
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h3 className="font-base text-gray-900 dark:text-white">
                                      {datatypes.title} <span className="text-xs text-gray-500 dark:text-gray-400">({datatypes.unit})</span>
                                    </h3>
                                  </div>
                                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                    selectedGraphs.includes(datatypes.id)
                                      ? 'border-blue-500 bg-blue-500'
                                      : 'border-gray-300 dark:border-gray-600'
                                  }`}>
                                    {selectedGraphs.includes(datatypes.id) && (
                                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                      </svg>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* GENR Dashboard - Multiple Machines with nested accordions */}
                {!machineName && machines && machines.length > 0 && (
                  <div className="space-y-3">
                    {machines.map((machine) => {
                      const machineName = machine.vName;
                      const isExpanded = expandedMachines.includes(machineName);
                      const dataTypes = machineDataTypes[machineName] || [];
                      const isLoading = loadingDataTypes[machineName];

                      return (
                        <div key={machineName} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                          {/* Machine Accordion Header */}
                          <button
                            onClick={() => toggleMachine(machineName)}
                            className="w-full px-4 py-3 flex items-center justify-between text-left bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {machineName}
                            </h4>
                            <svg
                              className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${
                                isExpanded ? 'transform rotate-180' : ''
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>

                          {/* Machine Data Types Content */}
                          <div
                            className={`transition-all duration-300 ease-in-out ${
                              isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
                            } overflow-hidden`}
                          >
                            <div className="p-3 space-y-2">
                              {isLoading && (
                                <div className="flex justify-center items-center py-4">
                                  <LoadingSpinner />
                                </div>
                              )}
                              
                              {!isLoading && dataTypes.length === 0 && isExpanded && (
                                <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                                  No data types available
                                </p>
                              )}

                              {!isLoading && dataTypes.map((datatypes) => {
                                const maxSelection = selectedType === 'Stat' ? 1 : 2;
                                return (
                                  <div
                                    key={datatypes.id}
                                    className={`p-3 rounded-lg border-2 transition-all ${
                                      selectedGraphs.includes(datatypes.id)
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                    } ${selectedGraphs.length >= maxSelection && !selectedGraphs.includes(datatypes.id) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                    onClick={() => {
                                      if (selectedGraphs.length < maxSelection || selectedGraphs.includes(datatypes.id)) {
                                        handleGraphSelection(datatypes.id, machineName);
                                      }
                                    }}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <h3 className="font-base text-gray-900 dark:text-white">
                                          {datatypes.title} <span className="text-xs text-gray-500 dark:text-gray-400">({datatypes.unit})</span>
                                        </h3>
                                      </div>
                                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                        selectedGraphs.includes(datatypes.id)
                                          ? 'border-blue-500 bg-blue-500'
                                          : 'border-gray-300 dark:border-gray-600'
                                      }`}>
                                        {selectedGraphs.includes(datatypes.id) && (
                                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                          </svg>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Display Dropdowns irrespective of GENR Dashboard or MACH Dashboard */}
                {dropdowns && dropdowns.length > 0 && (
                  <div className="space-y-3 mt-3">
                    {dropdowns.map((dropdown) => {
                      const dropdownName = dropdown;
                      const isExpanded = expandedMachines.includes(dropdownName);
                      const dataTypes = machineDataTypes[dropdownName] || [];
                      const isLoading = loadingDataTypes[dropdownName];

                      return (
                        <div key={dropdownName} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                          {/* Machine Accordion Header */}
                          <button
                            onClick={() => toggleMachine(dropdownName)}
                            className="w-full px-4 py-3 flex items-center justify-between text-left bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {dropdownName}
                            </h4>
                            <svg
                              className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${
                                isExpanded ? 'transform rotate-180' : ''
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>

                          {/* Dropdown Data Types Content */}
                          <div
                            className={`transition-all duration-300 ease-in-out ${
                              isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
                            } overflow-hidden`}
                          >
                            <div className="p-3 space-y-2">
                              {isLoading && (
                                <div className="flex justify-center items-center py-4">
                                  <LoadingSpinner />
                                </div>
                              )}
                              
                              {!isLoading && dataTypes.length === 0 && isExpanded && (
                                <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                                  No data types available
                                </p>
                              )}

                              {!isLoading && dataTypes.map((datatypes) => {
                                const maxSelection = selectedType === 'Stat' ? 1 : 2;
                                return (
                                  <div
                                    key={datatypes.id}
                                    className={`p-3 rounded-lg border-2 transition-all ${
                                      selectedGraphs.includes(datatypes.id)
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                    } ${selectedGraphs.length >= maxSelection && !selectedGraphs.includes(datatypes.id) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                    onClick={() => {
                                      if (selectedGraphs.length < maxSelection || selectedGraphs.includes(datatypes.id)) {
                                        handleGraphSelection(datatypes.id, dropdownName);
                                      }
                                    }}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <h3 className="font-base text-gray-900 dark:text-white">
                                          {datatypes.title} <span className="text-xs text-gray-500 dark:text-gray-400">({datatypes.unit})</span>
                                        </h3>
                                      </div>
                                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                        selectedGraphs.includes(datatypes.id)
                                          ? 'border-blue-500 bg-blue-500'
                                          : 'border-gray-300 dark:border-gray-600'
                                      }`}>
                                        {selectedGraphs.includes(datatypes.id) && (
                                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                          </svg>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              {/* Time Range Selection */}
            </div>
          </div>

          {/* Center Panel - Series Selection & Graph */}
          <div className="lg:col-span-6">
            <div className="custom-graph">
                {selectedGraphs.length > 0 ? (
                  <div className="space-y-6">
                    {/* Collapsible Series Selection & Generate Button */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                      {/* Accordion Header */}
                      <button
                        onClick={() => setIsAccordionOpen(!isAccordionOpen)}
                        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                          Configure Series
                        </h2>
                        <svg
                          className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${
                            isAccordionOpen ? 'transform rotate-180' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {/* Accordion Content */}
                      <div
                        className={`transition-all duration-300 ease-in-out ${
                          isAccordionOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                        } overflow-hidden`}
                      >
                        <div className="px-6 pb-6 space-y-6">
                          {/* Series Selection */}
                          {selectedGraphs.map((graphId) => {
                            // Find config - either from graphConfigs (MACH) or machineDataTypes (GENR)
                            let config = graphConfigs.find(g => g.id === graphId);
                            
                            // If not found in graphConfigs (GENR mode), search in machineDataTypes
                            if (!config && graphToMachineMap[graphId]) {
                              const machineForGraph = graphToMachineMap[graphId];
                              const machineTypes = machineDataTypes[machineForGraph] || [];
                              config = machineTypes.find(g => g.id === graphId);
                            }
                            
                            const series = availableSeries[graphId] || [];
                            const isLoading = loadingSeries[graphId];
                            const hasPivot = hasPivotMap[graphId];
                            
                            return (
                              <div key={graphId} className="pt-4 border-t border-gray-200 dark:border-gray-700 first:border-t first:pt-4">
                                {/* Add the machine name next to the title if in GENR mode */} 
                                <h3 className="text-base text-gray-900 dark:text-white mb-4 flex items-center">
                                  {graphToMachineMap[graphId] && (
                                    <span className="inline-flex items-center px-2 py-1 mr-0 rounded-md text-xs font-medium bg-purple-100 
                                    text-purple-800 dark:bg-purple-900 dark:text-purple-200 border border-purple-300 dark:border-purple-700 shadow-sm mr-2">
                                      {graphToMachineMap[graphId]}
                                    </span>
                                  )}
                                  <span 
                                    className="inline-flex items-center px-2 py-1 mr-0 rounded-md text-xs font-medium bg-blue-100 
                                    text-blue-800 dark:bg-blue-900 dark:text-blue-200 border border-blue-300 dark:border-blue-700 shadow-sm">
                                      {config?.title}  
                                  </span> 
                                  <span className="ml-1">{config?.pivot ? ': Select ' + config.pivot : ''}</span>
                                </h3>
                                {isLoading ? (
                                  <div className="flex justify-start items-center flex-col py-8">
                                    <LoadingSpinner height={24}/>
                                  </div>
                                ) : series.length > 0 ? (
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {series.map((seriesName) => {
                                      const isSelected = selectedSeries[graphId]?.includes(seriesName);
                                      const currentSeriesCount = selectedSeries[graphId]?.length || 0;
                                      const isDisabled = selectedType === 'Stat' && currentSeriesCount >= 1 && !isSelected;
                                      
                                      return (
                                        <button
                                          key={seriesName}
                                          onClick={() => handleSeriesSelection(graphId, seriesName)}
                                          disabled={isDisabled}
                                          className={`px-2 py-2 rounded-lg border-2 transition-all text-sm font-medium ${
                                            isSelected
                                              ? 'border-blue-500 bg-blue-500 text-white'
                                              : isDisabled
                                              ? 'border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 opacity-50 cursor-not-allowed'
                                              : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-400 dark:hover:border-blue-500'
                                          }`}
                                        >
                                          {seriesName}
                                        </button>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <p className="text-gray-500 dark:text-gray-400">
                                    {hasPivot === false 
                                      ? 'No series available for this Data type. Generate the data.' 
                                      : 'No series available for this Data type'}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                          {/* Aggregate Selection */}
                          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 first:border-t first:pt-4">
                            <h4 className="text-base text-gray-900 dark:text-white mb-4 flex items-center">Select Aggregation</h4>
                            <div className="mb-4 flex space-x-2">
                              {aggregates.map((aggregate) => (
                                <label
                                className={`px-4 py-2 rounded-lg border-2 font-medium transition-all cursor-pointer ${
                                  selectedAggregate === aggregate
                                  ? 'border-blue-500 bg-blue-500 text-white'
                                  : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-400 dark:hover:border-blue-500'
                                }`}
                                >
                                <input
                                type="radio"
                                checked={selectedAggregate === aggregate}
                                onChange={() => setSelectedAggregate(aggregate)} 
                                className="mr-2"
                                />
                                {aggregate}
                              </label>
                              ))}
                            </div>
                          </div>
                          {/* Generate Button */}
                          <div className="pt-0">
                            <button
                              onClick={handleGenerateGraph}
                              disabled={
                              generatingGraph || 
                              selectedGraphs.length === 0 ||
                                  // Disable if any graph has pivot=true and empty series with no selection
                                  selectedGraphs.some(graphId => {
                                    const hasPivot = hasPivotMap[graphId];
                                    const series = availableSeries[graphId] || [];
                                    const selected = selectedSeries[graphId] || [];
                                    // Disable if has_pivot is true and series is empty and nothing selected
                                    return hasPivot === true && series.length === 0 && selected.length === 0;
                                  })
                                }
                                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center"
                              >
                                {generatingGraph ? (
                                  <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Generating...
                                  </>
                                ) : (
                                  'Generate'
                                )}
                              </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Graph Display */}           
                    {graphData && (
                      <div className="text-right">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">                         
                          <DashboardBlock
                            config={{
                              Title: 'Custom ' + (graphData.saveableConfig ? graphData.saveableConfig.type : 'Custom title appears here'),
                              Series: graphData.series,
                              Units: graphData.units,
                              YAxisDomain: [0, 'auto'],
                              Color: chartColors
                            }}
                            initialData={graphData.type === 'Stat' ? [graphData] : [graphData.chartData]}
                            selectedType={graphData.type || selectedType}
                            axisConfig={graphData.axisConfig}
                            heightOuter={96}
                            heightInner={80}
                            blockIndex={0}
                            getUnitByTitle={getUnitByTitle}
                            handleCardClick={() => {}}
                            handleChartClick={handleChartClick}
                            getRandomColors={getRandomColors}
                            getFixedColors={getFixedColors}
                            isLoading={false}
                          />
                        </div>
                        <button
                        onClick={handleSaveGraph}
                        disabled={!saveableConfig}
                        className={`mt-4 px-4 py-2 w-full font-semibold rounded-lg transition-colors ${
                          saveableConfig
                            ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                            : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        }`}
                        title={!saveableConfig ? 'Generate a graph first' : ''}>
                          {isEditMode ? 'Update Component' : 'Add to Dashboard'}
                        </button>
                      </div>
                    )} 
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center h-96 flex flex-col justify-center items-center">
                    <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No data types selected
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Select one or two data types from the left panel to get started
                    </p>
                  </div>
                )}
            </div>
          </div>

          {/* Right Panel - Saved Custom Graphs */}
          {/* <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md py-6 pl-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 text-left pr-6">
                Selection History
              </h2>
              <div className="overflow-y-auto max-h-[80vh] custom-scrollbar pr-6">
                Right side panel content goes here
              </div>
            </div>
          </div> */}
        </div>
      </div>

      {/* Modal for Detailed Chart View */}
      <Modal isOpen={isChartModalOpen} onClose={() => setIsChartModalOpen(false)} size="full">
        <ZoomableChart
          data={graphData?.chartData}
          series={graphData?.series}
          color={chartColors}
          title="Custom Graph"
          unit={graphData?.unit}
          axisConfig={graphData?.axisConfig}
        />
      </Modal>

      {/* Add to Dashboard Modal */}
      <Modal 
        isOpen={isAddToDashboardModalOpen} 
        onClose={() => setIsAddToDashboardModalOpen(false)}
        size="default"
      >
        <AddComponentForm
          onClose={() => setIsAddToDashboardModalOpen(false)}
          dashboardId={dashboardId}
          saveableConfig={saveableConfig}
          isEditMode={isEditMode}
          initialData={componentToEdit}
        />
      </Modal>
    </Layout>
  );
};

export default ComponentBuilder;
