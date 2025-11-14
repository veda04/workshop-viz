import React, { useState, useEffect } from 'react';
import Layout from '../components/layouts/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import OverviewChart from '../components/charts/OverviewChart';
import ZoomableChart from '../components/charts/ZoomableChart';
import Modal from '../components/Modal';
import apiService from '../services/apiService';
import { getFixedColors } from '../utils/chartUtils';

const CustomGraphs = () => {
  const [graphConfigs, setGraphConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGraphs, setSelectedGraphs] = useState([]);
  const [availableSeries, setAvailableSeries] = useState({});
  const [selectedSeries, setSelectedSeries] = useState({});
  const [graphData, setGraphData] = useState(null);
  const [generatingGraph, setGeneratingGraph] = useState(false);
  const [timeRange, setTimeRange] = useState('3h');
  const [loadingSeries, setLoadingSeries] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [chartColors, setChartColors] = useState([]);

  // Handle chart click to open modal with ZoomableChart
  const handleChartClick = () => {
    if (!graphData || !graphData.chartData || graphData.chartData.length === 0) return;
    
    setModalContent(
        <ZoomableChart
        data={graphData.chartData}
        series={graphData.series}
        color={chartColors}
        title="Custom Graph"
        unit={graphData.unit}
        />
    );
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalContent(null);
  };

  // Fetch available graph configurations on mount
  useEffect(() => {
    const loadGraphConfigs = async () => {
      try {
        setLoading(true);
        const response = await apiService.getGraphConfigurations();
        if (response.status === 'success') {
          setGraphConfigs(response.data);
          setError(null);
        } else {
          setError(response.message || 'Failed to load graph configurations');
        }
      } catch (err) {
        setError(err.message || 'Failed to load graph configurations');
      } finally {
        setLoading(false);
      }
    };

    loadGraphConfigs();
  }, []);

  // Handle graph selection
  const handleGraphSelection = async (graphId) => {
    setSelectedGraphs((prev) => {
      // Toggle selection
      if (prev.includes(graphId)) {
        // Remove graph
        const newSelection = prev.filter(id => id !== graphId);
        // Remove associated series
        const newSeries = { ...selectedSeries };
        delete newSeries[graphId];
        setSelectedSeries(newSeries);
        
        const newAvailable = { ...availableSeries };
        delete newAvailable[graphId];
        setAvailableSeries(newAvailable);
        
        return newSelection;
      } else {
        // Add graph (max 2)
        if (prev.length < 2) {
          // Fetch available series for this graph
          fetchAvailableSeries(graphId);
          return [...prev, graphId];
        }
        return prev;
      }
    });
  };

  // Fetch available series for a graph
  const fetchAvailableSeries = async (graphId) => {
    try {
      setLoadingSeries(prev => ({ ...prev, [graphId]: true }));
      const response = await apiService.getAvailableSeries(graphId, 'Hurco', '1h');
      if (response.status === 'success') {
        setAvailableSeries(prev => ({
          ...prev,
          [graphId]: response.data
        }));
      } else {
        console.error('Failed to fetch series:', response.message);
      }
    } catch (err) {
      console.error(`Error fetching series for graph ${graphId}:`, err);
    } finally {
      setLoadingSeries(prev => ({ ...prev, [graphId]: false }));
    }
  };

  // Handle series selection
  const handleSeriesSelection = (graphId, seriesName) => {
    setSelectedSeries((prev) => {
      const graphSeries = prev[graphId] || [];
      const newGraphSeries = graphSeries.includes(seriesName)
        ? graphSeries.filter(s => s !== seriesName)
        : [...graphSeries, seriesName];
      
      return {
        ...prev,
        [graphId]: newGraphSeries
      };
    });
  };

  // Generate graph
  const handleGenerateGraph = async () => {
    if (selectedGraphs.length === 0) {
      setError('Please select at least one graph type');
      return;
    }

    // Check if series are selected for each graph
    for (const graphId of selectedGraphs) {
      if (!selectedSeries[graphId] || selectedSeries[graphId].length === 0) {
        setError(`Please select at least one series for ${graphConfigs.find(g => g.id === graphId)?.title}`);
        return;
      }
    }

    try {
      setGeneratingGraph(true);
      setError(null);
      const response = await apiService.getCustomGraphData({
        graphs: selectedGraphs,
        series: selectedSeries,
        range: timeRange
      });
      
      if (response.status === 'success') {
        setGraphData(response.data);
        // Generate colors using the existing function from dashboard
        const numSeries = response.data.series.length;
        const colors = getFixedColors(numSeries);
        setChartColors(colors);
      } else {
        setError(response.message || 'Failed to generate graph');
      }
    } catch (err) {
      setError(err.message || 'Failed to generate graph');
    } finally {
      setGeneratingGraph(false);
    }
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
      <div className="dash-cover max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="my-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Customize Graphs
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Select up to 2 graph types and their series to generate a custom visualization
          </p>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorMessage message={error} onDismiss={() => setError(null)} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Graph Selection */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Select Graph Types
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                  ({selectedGraphs.length}/2)
                </span>
              </h2>

              <div className="space-y-3">
                {graphConfigs.map((config) => (
                  <div
                    key={config.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedGraphs.includes(config.id)
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    } ${selectedGraphs.length >= 2 && !selectedGraphs.includes(config.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => handleGraphSelection(config.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {config.title}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {config.unit}
                        </p>
                      </div>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        selectedGraphs.includes(config.id)
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {selectedGraphs.includes(config.id) && (
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
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Time Range
                </h3>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="30m">Last 30 minutes</option>
                  <option value="1h">Last 1 hour</option>
                  <option value="3h">Last 3 hours</option>
                  <option value="6h">Last 6 hours</option>
                  <option value="12h">Last 12 hours</option>
                  <option value="24h">Last 24 hours</option>
                </select>
              </div>
            </div>
          </div>

          {/* Right Panel - Series Selection & Graph */}
          <div className="lg:col-span-2">
            {selectedGraphs.length > 0 ? (
              <div className="space-y-6">
                {/* Series Selection */}
                {selectedGraphs.map((graphId) => {
                  const config = graphConfigs.find(g => g.id === graphId);
                  const series = availableSeries[graphId] || [];
                  const isLoading = loadingSeries[graphId];
                  
                  return (
                    <div key={graphId} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        {config?.title} - Select Series
                      </h2>
                      
                      {isLoading ? (
                        <div className="flex justify-center items-center py-8">
                          <LoadingSpinner />
                          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading series...</span>
                        </div>
                      ) : series.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {series.map((seriesName) => (
                            <button
                              key={seriesName}
                              onClick={() => handleSeriesSelection(graphId, seriesName)}
                              className={`px-4 py-2 rounded-lg border-2 transition-all text-sm font-medium ${
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
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
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

                {/* Graph Display */}
                {graphData && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <OverviewChart
                      title="Custom Graph"
                      data={graphData.chartData}
                      series={graphData.series}
                      color={chartColors}
                      yAxisDomain={[0, 'auto']}
                      unit={graphData.unit}
                      onClick={handleChartClick}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
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
      </div>

      {/* Modal for Detailed Chart View */}
      <Modal isOpen={isModalOpen} onClose={closeModal} size="full">
        {modalContent}
      </Modal>
    </Layout>
  );
};

export default CustomGraphs;
