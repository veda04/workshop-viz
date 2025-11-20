import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/apiService';

export const useCustomGraphData = (machineName) => {
  const [graphConfigs, setGraphConfigs] = useState([]);
  const [selectedGraphs, setSelectedGraphs] = useState([]);
  const [availableSeries, setAvailableSeries] = useState({});
  const [selectedSeries, setSelectedSeries] = useState({});
  const [graphData, setGraphData] = useState(null);
  const [timeRange, setTimeRange] = useState('3h');
  const [loading, setLoading] = useState(true);
  const [loadingSeries, setLoadingSeries] = useState({});
  const [generatingGraph, setGeneratingGraph] = useState(false);
  const [error, setError] = useState(null);

  // Fetch available graph configurations on mount
  useEffect(() => {
    const loadGraphConfigs = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiService.getGraphConfigurations(machineName);
        
        if (response.status === 'success') {
          setGraphConfigs(response.data);
        } else {
          setError(response.message || 'Failed to load graph configurations');
        }
      } catch (err) {
        setError(err.message || 'Failed to load graph configurations');
      } finally {
        setLoading(false);
      }
    };

    if (machineName) {
      loadGraphConfigs();
    }
  }, [machineName]);

  // Fetch available series for a specific graph
  const fetchAvailableSeries = useCallback(async (graphId) => {
    try {
      setLoadingSeries(prev => ({ ...prev, [graphId]: true }));
      const response = await apiService.getAvailableSeries(graphId, machineName, '1h');
      
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
  }, [machineName]);

  // Handle graph selection (max 2 graphs)
  const handleGraphSelection = useCallback((graphId) => {
    setSelectedGraphs((prev) => {
      // Toggle selection
      if (prev.includes(graphId)) {
        // Remove graph
        const newSelection = prev.filter(id => id !== graphId);
        
        // Remove associated series
        setSelectedSeries(current => {
          const newSeries = { ...current };
          delete newSeries[graphId];
          return newSeries;
        });
        
        setAvailableSeries(current => {
          const newAvailable = { ...current };
          delete newAvailable[graphId];
          return newAvailable;
        });
        
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
  }, [fetchAvailableSeries]);

  // Handle series selection for a graph
  const handleSeriesSelection = useCallback((graphId, seriesName) => {
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
  }, []);

  // Generate custom graph
  const generateGraph = useCallback(async () => {
    if (selectedGraphs.length === 0) {
      setError('Please select at least one graph type');
      return false;
    }

    // Check if series are selected for each graph
    for (const graphId of selectedGraphs) {
      if (!selectedSeries[graphId] || selectedSeries[graphId].length === 0) {
        const config = graphConfigs.find(g => g.id === graphId);
        setError(`Please select at least one series for ${config?.title}`);
        return false;
      }
    }

    try {
      setGeneratingGraph(true);
      setError(null);
      
      const response = await apiService.getCustomGraphData({
        graphs: selectedGraphs,
        series: selectedSeries,
        range: timeRange,
      }, machineName);
      
      if (response.status === 'success') {
        // Organize data with axis information
        const graphDataWithAxes = {
          ...response.data,
          axisConfig: selectedGraphs.map((graphId, index) => {
            const config = graphConfigs.find(g => g.id === graphId);
            return {
              graphId,
              position: index === 0 ? 'left' : 'right',
              unit: config?.unit || '',
              title: config?.title || '',
              series: selectedSeries[graphId] || []
            };
          })
        };
        
        setGraphData(graphDataWithAxes);
        return true;
      } else {
        setError(response.message || 'Failed to generate graph');
        return false;
      }
    } catch (err) {
      setError(err.message || 'Failed to generate graph');
      return false;
    } finally {
      setGeneratingGraph(false);
    }
  }, [selectedGraphs, selectedSeries, timeRange, machineName, graphConfigs]);

  // Reset error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
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
    
    // Actions
    setTimeRange,
    handleGraphSelection,
    handleSeriesSelection,
    generateGraph,
    clearError,
  };
};
