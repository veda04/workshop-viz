import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/apiService';

export const useComponentBuilderData = (machineName) => {
  const [graphConfigs, setGraphConfigs] = useState([]);
  const [machines, setMachines] = useState([]);
  const [dropdowns, setDropdowns] = useState([]);
  const [machineDataTypes, setMachineDataTypes] = useState({});
  const [selectedGraphs, setSelectedGraphs] = useState([]);
  const [graphToMachineMap, setGraphToMachineMap] = useState({}); // Maps graphId to machineName
  const [availableSeries, setAvailableSeries] = useState({});
  const [hasPivotMap, setHasPivotMap] = useState({}); // Maps graphId to has_pivot flag
  const [selectedSeries, setSelectedSeries] = useState({});
  const [selectedType, setSelectedType] = useState('Graph');
  const [selectedAggregate, setSelectedAggregate] = useState('Max');
  const [graphData, setGraphData] = useState(null);
  const [timeRange, setTimeRange] = useState('3h');
  const [loading, setLoading] = useState(true);
  const [loadingSeries, setLoadingSeries] = useState({});
  const [loadingDataTypes, setLoadingDataTypes] = useState({});
  const [generatingGraph, setGeneratingGraph] = useState(false);
  const [error, setError] = useState(null);

  // Handle selectedType change - clear extra selections if switching to Stat
  useEffect(() => {
    if (selectedType === 'Stat') {
      // If more than 1 graph selected, keep only the first
      if (selectedGraphs.length > 1) {
        const graphToKeep = selectedGraphs[0];
        setSelectedGraphs([graphToKeep]);
        
        // Clear series for removed graphs, and keep only first series for kept graph
        setSelectedSeries(current => {
          const keptGraphSeries = current[graphToKeep] || [];
          return {
            [graphToKeep]: keptGraphSeries.length > 0 ? [keptGraphSeries[0]] : []
          };
        });
        
        setAvailableSeries(current => ({
          [graphToKeep]: current[graphToKeep]
        }));
        
        // Keep only the mapping for the kept graph
        setGraphToMachineMap(current => ({
          [graphToKeep]: current[graphToKeep]
        }));
      } else {
        // If only 1 graph selected, limit its series to 1
        setSelectedSeries(current => {
          const newSeries = {};
          selectedGraphs.forEach(graphId => {
            const graphSeries = current[graphId] || [];
            newSeries[graphId] = graphSeries.length > 0 ? [graphSeries[0]] : [];
          });
          return newSeries;
        });
      }
    }
  }, [selectedType, selectedGraphs]);

  // Fetch available data types 
  useEffect(() => {
    const loadDataTypeConfigs = async () => {
      try {
        setLoading(true);
        setError(null);

        // If machineName is passed as a parameter (MACH dashboard), load data for the selected machine
        if (machineName) {
          const response = await apiService.getDataTypes(machineName);
          
          if (response.status === 'success') {
            // For MACH dashboard, also create unique IDs for consistency
            const dataTypesWithUniqueIds = response.data.map(dataType => ({
              ...dataType,
              originalId: dataType.id, // Store original ID for API calls
              id: `${machineName}_${dataType.id}` // Create unique ID
            }));
            
            setGraphConfigs(dataTypesWithUniqueIds);
            setMachines([{ vName: machineName }]);
            setMachineDataTypes({ [machineName]: dataTypesWithUniqueIds });
          } else {
            setError(response.message || 'Failed to load data types');
          }
          
          // Fetch all the dropdowns for MACH dashboard
          const dropdownResponse = await apiService.getDropdownsFromConfig();
          if (dropdownResponse.status === 'success') {
            setDropdowns(dropdownResponse.data);
          } else {
            setError(dropdownResponse.message || 'Failed to load dropdowns');
          }
        } else {
          // If no machineName passed as parameter, its (GENR dashboard), get all machines first
          const machinesResponse = await apiService.getMachinesWithConfig();
        
          if (machinesResponse.status === 'success') {
            setMachines(machinesResponse.data);
            // Don't load data types yet - will be loaded when accordion is expanded
          } else {
            setError(machinesResponse.message || 'Failed to load machines');
          }
          
          // Fetch all the dropdowns for GENR dashboard
          const dropdownResponse = await apiService.getDropdownsFromConfig();
          if (dropdownResponse.status === 'success') {
            setDropdowns(dropdownResponse.data);
          } else {
            setError(dropdownResponse.message || 'Failed to load dropdowns');
          }
        }
      } catch (err) {
        setError(err.message || 'Failed to load data types');
      } finally {
        setLoading(false);
      }
    };

    loadDataTypeConfigs();
  }, [machineName]);

  // Fetch data types for a specific machine (for GENR dashboards when accordion is expanded)
  const fetchDataTypesForMachine = useCallback(async (machine) => {
    // Skip if already loaded
    if (machineDataTypes[machine]) {
      return;
    }

    try {
      setLoadingDataTypes(prev => ({ ...prev, [machine]: true }));
      const response = await apiService.getDataTypes(machine);
      
      if (response.status === 'success') {
        // Create unique IDs by prefixing with machine name
        const dataTypesWithUniqueIds = response.data.map(dataType => ({
          ...dataType,
          originalId: dataType.id, // Store original ID for API calls
          id: `${machine}_${dataType.id}` // Create unique ID
        }));
        
        setMachineDataTypes(prev => ({
          ...prev,
          [machine]: dataTypesWithUniqueIds
        }));
      } else {
        console.error(`Failed to fetch data types for ${machine}:`, response.message);
      }
    } catch (err) {
      console.error(`Error fetching data types for ${machine}:`, err);
    } finally {
      setLoadingDataTypes(prev => ({ ...prev, [machine]: false }));
    }
  }, [machineDataTypes]);

  // Fetch available series for a specific graph
  const fetchAvailableSeries = useCallback(async (graphId, machineNameForGraph) => {
    try {
      setLoadingSeries(prev => ({ ...prev, [graphId]: true }));
      
      // Extract original ID from unique ID (format: MachineName_OriginalId)
      const originalId = graphId.includes('_') ? graphId.split('_')[1] : graphId;
      
      const response = await apiService.getAvailableSeries(originalId, machineNameForGraph, '3h');
      
      if (response.status === 'success') {
        setAvailableSeries(prev => ({
          ...prev,
          [graphId]: response.data
        }));
        
        // Store has_pivot flag for this graph
        setHasPivotMap(prev => ({
          ...prev,
          [graphId]: response.has_pivot !== undefined ? response.has_pivot : true
        }));
      } else {
        console.error('Failed to fetch series:', response.message);
      }
    } catch (err) {
      console.error(`Error fetching series for graph ${graphId}:`, err);
    } finally {
      setLoadingSeries(prev => ({ ...prev, [graphId]: false }));
    }
  }, []);

  // Handle graph selection (max 1 for Stat, max 2 for Graph)
  const handleGraphSelection = useCallback((graphId, machineNameForGraph = null) => {
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
        
        // Remove from machine map
        setGraphToMachineMap(current => {
          const newMap = { ...current };
          delete newMap[graphId];
          return newMap;
        });
        
        return newSelection;
      } else {
        // Determine max selection based on selectedType
        const maxSelection = selectedType === 'Stat' ? 1 : 2;
        
        // Add graph (max 1 for Stat, max 2 for Graph)
        if (prev.length < maxSelection) {
          // Determine which machine name to use
          const machineToUse = machineNameForGraph || machineName;
          
          // Store the machine name for this graph
          setGraphToMachineMap(current => ({
            ...current,
            [graphId]: machineToUse
          }));
          
          // Fetch available series for this graph
          fetchAvailableSeries(graphId, machineToUse);
          return [...prev, graphId];
        }
        return prev;
      }
    });
  }, [fetchAvailableSeries, machineName, selectedType]);

  // Handle series selection for a graph
  const handleSeriesSelection = useCallback((graphId, seriesName) => {
    setSelectedSeries((prev) => {
      const graphSeries = prev[graphId] || [];
      const isRemoving = graphSeries.includes(seriesName);
      
      // If removing, just filter it out
      if (isRemoving) {
        return {
          ...prev,
          [graphId]: graphSeries.filter(s => s !== seriesName)
        };
      }
      
      // If adding and Stat mode, limit to 1 series
      if (selectedType === 'Stat' && graphSeries.length >= 1) {
        return prev; // Don't add more series in Stat mode
      }
      
      // Add the series (Graph mode or first series in Stat mode)
      return {
        ...prev,
        [graphId]: [...graphSeries, seriesName]
      };
    });
  }, [selectedType]);

  // Generate custom graph
  const generateGraph = useCallback(async () => {
    if (selectedGraphs.length === 0) {
      setError('Please select at least one graph type');
      return false;
    }

    // Check if series are selected for each graph (only when has_pivot is true or has available series)
    for (const graphId of selectedGraphs) {
      const hasPivot = hasPivotMap[graphId];
      const availableSeriesForGraph = availableSeries[graphId] || [];
      const selectedSeriesForGraph = selectedSeries[graphId] || [];
      
      // Only require series selection if:
      // 1. has_pivot is true (or undefined for backward compatibility)
      // 2. AND there are series available to select
      // Skip validation if has_pivot is false (no pivot needed)
      if ((hasPivot === undefined || hasPivot === true) && 
          availableSeriesForGraph.length > 0 && 
          selectedSeriesForGraph.length === 0) {
        const config = graphConfigs.find(g => g.id === graphId);
        setError(`Please select at least one series for ${config?.title}`);
        return false;
      }
    }

    try {
      setGeneratingGraph(true);
      setError(null);
      
      // Build array of machine names (one per selected graph)
      const machineNamesArray = selectedGraphs.map(graphId => {
        // Use graphToMachineMap for GENR dashboards, or machineName for MACH dashboards
        return graphToMachineMap[graphId] || machineName;
      });
      
      // For backward compatibility, use first machine name
      const machineToUse = machineNamesArray[0];
      
      // Convert unique IDs back to original IDs for API call
      const originalGraphIds = selectedGraphs.map(graphId => {
        // Extract original ID from unique ID (format: MachineName_OriginalId)
        return graphId.includes('_') ? graphId.split('_')[1] : graphId;
      });

      // Convert series object keys from unique IDs to original IDs
      const originalSeriesMapping = {};
      selectedGraphs.forEach((uniqueGraphId, index) => {
        const originalId = originalGraphIds[index];
        originalSeriesMapping[index] = {
            originalId,
            series: selectedSeries[uniqueGraphId]
        };
        //originalSeriesMapping[originalId] = selectedSeries[uniqueGraphId];  // old code
      });
      
      const response = await apiService.generateData({
        type: selectedType,
        aggregate: selectedAggregate.toLocaleLowerCase(),
        graphs: originalGraphIds,
        series: originalSeriesMapping,
        range: timeRange,
        machine_names: machineNamesArray,  // NEW: Send array of machine names
      }, machineToUse);
      
      if (response.status === 'success') {
        // Organize data with axis information
        const graphDataWithAxes = {
          ...response.data,
          saveableConfig: response.saveableConfig, // NEW: Include saveable config from backend
          axisConfig: selectedGraphs.map((graphId, index) => {
            // Find config - either from graphConfigs (MACH) or machineDataTypes (GENR)
            let config = graphConfigs.find(g => g.id === graphId);
            
            // Determine machine name for this graph
            const machineForGraph = graphToMachineMap[graphId] || machineName;
            
            // If not found in graphConfigs (GENR mode), search in machineDataTypes
            if (!config && machineForGraph && machineDataTypes[machineForGraph]) {
              const machineTypes = machineDataTypes[machineForGraph] || [];
              config = machineTypes.find(g => g.id === graphId);
            }
            
            // generated for axis config
            return {
              graphId,
              machineName: machineForGraph,  // NEW: Include machine/dropdown name
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
  }, [selectedType, selectedAggregate, selectedGraphs, selectedSeries, timeRange, machineName, graphConfigs, graphToMachineMap, machineDataTypes, hasPivotMap, availableSeries]);

  // Reset error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    graphConfigs,
    machines,
    dropdowns,
    machineDataTypes,
    graphToMachineMap,
    selectedGraphs,
    availableSeries,
    hasPivotMap,
    selectedSeries,
    selectedType,
    setSelectedType,
    selectedAggregate,
    setSelectedAggregate,
    graphData,
    timeRange,
    loading,
    loadingSeries,
    loadingDataTypes,
    generatingGraph,
    error,
    
    // Actions
    setTimeRange,
    handleGraphSelection,
    handleSeriesSelection,
    generateGraph,
    clearError,
    fetchDataTypesForMachine,
    fetchAvailableSeries,
    
    // State setters for edit mode
    setSelectedGraphs,
    setSelectedSeries,
    setGraphToMachineMap,
  };
};
