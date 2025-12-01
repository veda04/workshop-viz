import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '../components/layouts/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import OverviewChart from '../components/charts/OverviewChart';
import ZoomableChart from '../components/charts/ZoomableChart';
import Modal from '../components/Modal';
import CustomGraphsForm from '../components/forms/CustomGraphsForm';
import SavedGraphsSection from '../components/SavedGraphsSection';
import { useCustomGraphData } from '../hooks/useCustomGraphData';
import { getFixedColors } from '../utils/chartUtils';

const CustomGraphs = () => {
  const [searchParams] = useSearchParams();
  const machineName = searchParams.get('machineName');
  
  // Use custom hook for graph data management
  const {
    graphConfigs,
    selectedGraphs,
    availableSeries,
    selectedSeries,
    graphData,
    timeRange,
    loading,
    loadingSeries,
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
    setSelectedType
  } = useCustomGraphData(machineName);

  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const [isSaveGraphModalOpen, setIsSaveGraphModalOpen] = useState(false);
  const [chartColors, setChartColors] = useState([]);
  const [isAccordionOpen, setIsAccordionOpen] = useState(true);
  const [editGraphId, setEditGraphId] = useState(null);
  const [editGraphData, setEditGraphData] = useState(null);
  const custom_types = ['graph', 'stats', 'info'];

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

  // Handle generate graph button click
  const handleGenerateGraph = async () => {
    const success = await generateGraph();
    if (success) {
      setIsAccordionOpen(false); // Collapse accordion after successful generation
    }
  };


  // Handle Save Graph button click
  const handleSaveGraph = () => {
    if (!graphData || !graphData.chartData || graphData.chartData.length === 0) {
      return;
    }
    setIsSaveGraphModalOpen(true);
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
      <Layout>
        <div className="flex justify-center items-center min-h-screen">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  return (
    <Layout> 
      <div className="dash-cover mx-auto px-4 sm:px-6 lg:px-8 py-8"> {/* max-w-7xl */}
        <div className="mt-0 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Customize Graphs
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Select up to 2 graph types and their series to generate a custom visualization
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
                        <option key={type} value={type}>
                          {type}
                        </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Select Data Types
                  <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                    ({selectedGraphs.length}/2)
                  </span>
                  </h2>
                  <div className="space-y-3">
                  {graphConfigs.map((datatypes) => (
                    <div
                    key={datatypes.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedGraphs.includes(datatypes.id)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    } ${selectedGraphs.length >= 2 && !selectedGraphs.includes(datatypes.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => handleGraphSelection(datatypes.id)}
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
                  ))}
                  </div>

                  {/* Time Range Selection */}
              {/* <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Time Range
                </h3>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="w-full px-4 py-2 font-base rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="30m">Last 30 minutes</option>
                  <option value="1h">Last 1 hour</option>
                  <option value="3h">Last 3 hours</option>
                  <option value="6h">Last 6 hours</option>
                  <option value="12h">Last 12 hours</option>
                  <option value="24h">Last 24 hours</option>
                </select>
              </div> */}
            </div>
          </div>

          {/* Center Panel - Series Selection & Graph */}
          <div className="lg:col-span-6">
            <div class="custom-graph">
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
                            const config = graphConfigs.find(g => g.id === graphId);
                            const series = availableSeries[graphId] || [];
                            const isLoading = loadingSeries[graphId];
                            
                            return (
                              <div key={graphId} className="pt-4 border-t border-gray-200 dark:border-gray-700 first:border-t first:pt-4">
                                <h3 className="text-base text-gray-900 dark:text-white mb-4 flex items-center">
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
                                    {series.map((seriesName) => (
                                      <button
                                        key={seriesName}
                                        onClick={() => handleSeriesSelection(graphId, seriesName)}
                                        className={`px-2 py-2 rounded-lg border-2 transition-all text-sm font-medium ${
                                          selectedSeries[graphId]?.includes(seriesName)
                                            ? 'border-blue-500 bg-blue-500 text-white'
                                            : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-400 dark:hover:border-blue-500'
                                        }`}
                                      >
                                        {seriesName}
                                      </button>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-gray-500 dark:text-gray-400">
                                    No series available for this graph
                                  </p>
                                )}
                              </div>
                            );
                          })}

                          {/* Generate Button */}
                          <div className="pt-4">
                            <button
                              onClick={handleGenerateGraph}
                              disabled={generatingGraph || selectedGraphs.length === 0}
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
                                'Generate Graph'
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
                          {/* Graph Title and Badge */}
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {graphData.savedGraphInfo ? graphData.savedGraphInfo.title : 'Custom Graph'}
                            </h3>
                            {graphData.savedGraphInfo?.addedToDashboard && (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border border-green-300 dark:border-green-700">
                                <svg 
                                  className="w-3 h-3 mr-1" 
                                  fill="currentColor" 
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                                </svg>
                                Added to Dashboard
                              </span>
                            )}
                          </div>
                          
                          <OverviewChart
                            title=""
                            data={graphData.chartData}
                            series={graphData.series}
                            color={chartColors}
                            yAxisDomain={[0, 'auto']}
                            unit={graphData.unit}
                            onClick={handleChartClick}
                            axisConfig={graphData.axisConfig}
                            heightOuter={96}
                            heightInner={80}
                          />
                        </div>
                        <button
                        onClick={handleSaveGraph}
                        className='mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors'>
                          Save Graph
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
                      No graphs selected
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Select one or two graph types from the left panel to get started
                    </p>
                  </div>
                )}
            </div>
          </div>

          {/* Right Panel - Saved Custom Graphs */}
          {/* <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md py-6 pl-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 text-center pr-6">
                Customized Graphs
                {savedGraphs.length > 0 && (
                  <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                    ({savedGraphs.length})
                  </span>
                )}
              </h2>
              <div className="overflow-y-auto max-h-[80vh] custom-scrollbar pr-6">
                <SavedGraphsSection
                  savedGraphs={savedGraphs}
                  loading={loadingSavedGraphs}
                  onGraphClick={handleSavedGraphClick}
                  onGraphDelete={handleDeleteGraph}
                />
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

      {/* Modal for Save Graph Form */}
      <Modal isOpen={isSaveGraphModalOpen} onClose={() => {
        setIsSaveGraphModalOpen(false);
        // Clear edit mode when modal is closed
        setEditGraphId(null);
        setEditGraphData(null);
      }} size="large">
        <CustomGraphsForm
          onClose={() => {
            setIsSaveGraphModalOpen(false);
            setEditGraphId(null);
            setEditGraphData(null);
          }}
          machineName={machineName}
          selectedGraphs={selectedGraphs}
          selectedSeries={selectedSeries}
          graphConfigs={graphConfigs}
          onSaveSuccess={handleSaveSuccess}
          editGraphId={editGraphId}
          editGraphData={editGraphData}
        />
      </Modal>
    </Layout>
  );
};

export default CustomGraphs;
