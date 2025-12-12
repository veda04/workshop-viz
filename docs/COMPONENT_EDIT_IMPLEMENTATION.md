# Component Edit Feature Implementation

## Overview
This document describes the implementation of the component edit feature in the Workshop Visualization application. The feature allows users to edit existing dashboard components by loading their saved configurations, modifying them, and updating the component.

## Feature Description
When a user clicks the "Edit" button on a component in the DashboardSummary page, they are redirected to the ComponentBuilder page with the component's existing configuration pre-populated. The user can then modify the configuration and update the component.

---

## Architecture Changes

### 1. Navigation Flow

#### DashboardSummary.jsx → ComponentBuilder.jsx
```
Edit Click → Navigate with Parameters:
  - dashboardId
  - title
  - machineName (if applicable)
  - mode=E (Edit mode identifier)
  - component_id
  - hasComponents=true (for header display)
```

**File:** `src/pages/DashboardSummary.jsx`

**Changes:**
- Updated `handleEdit()` function to include all necessary parameters in the navigation URL
- Added `machineName` parameter for machine-specific dashboards
- Added `hasComponents` flag to maintain header visibility

```javascript
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
```

---

### 2. Backend API Support

#### Component Retrieval Endpoint
**Endpoint:** `GET /api/components/{component_id}/`

**File:** `backend/workshopviz/views.py`

**Function:** `get_component(request, component_id)`

**Response Structure:**
```json
{
  "success": true,
  "data": {
    "icomponent_id": 45,
    "iDashboard_id": 12,
    "vTitle": "Cincinnati Acceleration",
    "vDescription": "3-hour view",
    "iPosition": 1,
    "vQuery": {
      "type": "Graph",
      "aggregate": "max",
      "graphs": [1],
      "machine_names": ["Cincinnati"],
      "series": {
        "1": ["X-Axis", "Y-Axis"]
      },
      "range": "3h"
    },
    "dtCreated": "2025-12-05T10:30:00Z",
    "dtModified": "2025-12-05T10:30:00Z"
  }
}
```

**vQuery Structure:**
- `type`: Component type ('Graph' or 'Stat')
- `aggregate`: Aggregation method ('max', 'min', or 'mean')
- `graphs`: Array of graph IDs (data type IDs)
- `machine_names`: Array of machine/dropdown names
- `series`: Object mapping graph IDs to selected series arrays
- `range`: Time range string (e.g., '3h', '24h')

---

### 3. Frontend State Management

#### useComponentBuilderData Hook Enhancements

**File:** `src/hooks/useComponentBuilderData.js`

**New Exports Added:**
```javascript
return {
  // ... existing exports
  
  // New exports for edit mode
  fetchAvailableSeries,    // Fetch series data for a graph
  setSelectedGraphs,       // Programmatically set selected graphs
  setSelectedSeries,       // Programmatically set selected series
  setGraphToMachineMap,    // Set graph-to-machine mapping
};
```

**Purpose:**
These exports allow the ComponentBuilder to programmatically populate the form state when loading a component for editing, bypassing the normal user-interaction flow.

---

### 4. ComponentBuilder Page Changes

**File:** `src/pages/ComponentBuilder.jsx`

#### 4.1 Edit Mode Detection

```javascript
const mode = searchParams.get('mode'); // 'E' for edit mode
const componentId = searchParams.get('component_id');
const isEditMode = mode === 'E' && componentId;
```

#### 4.2 New State Variables

```javascript
// Track loaded component data for auto-generation
const [loadedComponentData, setLoadedComponentData] = useState(null);

// Store component being edited
const [componentToEdit, setComponentToEdit] = useState(null);
```

#### 4.3 Load Component Effect

```javascript
// Load component data in edit mode
useEffect(() => {
  if (isEditMode && componentId) {
    loadComponentForEdit(componentId);
  }
}, [isEditMode, componentId]);
```

---

## Component Loading Process

### Step-by-Step Flow

#### 1. Fetch Component Data
```javascript
const response = await apiService.getComponent(compId);
const component = response.data;
const vQuery = component.vQuery;
```

#### 2. Pre-populate Form Fields

##### Type and Aggregation
```javascript
if (vQuery.type) {
  setSelectedType(vQuery.type);
}
if (vQuery.aggregate) {
  // Capitalize first letter to match dropdown values (max → Max)
  const capitalizedAggregate = vQuery.aggregate.charAt(0).toUpperCase() + 
                               vQuery.aggregate.slice(1);
  setSelectedAggregate(capitalizedAggregate);
}
```

##### Time Range
```javascript
if (vQuery.range) {
  setTimeRange(vQuery.range);
}
```

#### 3. Load Machine Data Types (GENR Dashboard Only)

For general dashboards without a specific machine, data types must be loaded for each machine:

```javascript
if (!machineName && vQuery.machine_names) {
  await Promise.all(
    vQuery.machine_names.map(machine => fetchDataTypesForMachine(machine))
  );
}
```

#### 4. Create Unique Graph IDs

To avoid ID conflicts when multiple machines have the same data type IDs:

```javascript
const uniqueGraphIds = vQuery.graphs.map((graphId, index) => {
  const machineName = vQuery.machine_names[index];
  return `${machineName}_${graphId}`; // Format: Cincinnati_1
});
```

#### 5. Build Graph-to-Machine Mapping

```javascript
const graphMap = {};
uniqueGraphIds.forEach((uniqueId, index) => {
  graphMap[uniqueId] = vQuery.machine_names[index];
});
setGraphToMachineMap(graphMap);
```

#### 6. Expand Machine Accordions

```javascript
const uniqueMachines = [...new Set(vQuery.machine_names)];
setExpandedMachines(uniqueMachines);
```

#### 7. Fetch and Set Series Data

```javascript
const seriesPromises = uniqueGraphIds.map(async (uniqueGraphId, index) => {
  const originalGraphId = vQuery.graphs[index];
  const machineNameForGraph = vQuery.machine_names[index];
  
  // Fetch available series for this graph
  await fetchAvailableSeries(uniqueGraphId, machineNameForGraph);
  
  // Return series to set
  return {
    graphId: uniqueGraphId,
    originalGraphId: originalGraphId,
    series: vQuery.series[originalGraphId] || []
  };
});

const seriesData = await Promise.all(seriesPromises);

// Set all series in batch
const newSelectedSeries = {};
seriesData.forEach(item => {
  if (item.series.length > 0) {
    newSelectedSeries[item.graphId] = item.series;
  }
});
setSelectedSeries(newSelectedSeries);
```

#### 8. Trigger Auto-Generation

```javascript
setLoadedComponentData({
  uniqueGraphIds,
  seriesData: newSelectedSeries,
  vQuery
});
```

---

## Auto-Generation Mechanism

### Auto-Generation Effect

**File:** `src/pages/ComponentBuilder.jsx`

```javascript
// Auto-generate graph after component is loaded in edit mode
useEffect(() => {
  if (loadedComponentData && selectedGraphs.length > 0) {
    // Validate all necessary data is loaded
    const hasAllData = selectedGraphs.every(graphId => {
      const seriesAvailable = availableSeries[graphId];
      const selectedSeriesForGraph = selectedSeries[graphId];
      
      // If series are available and none selected, wait
      if (seriesAvailable && seriesAvailable.length > 0 && 
          (!selectedSeriesForGraph || selectedSeriesForGraph.length === 0)) {
        return false;
      }
      
      return true;
    });
    
    if (hasAllData) {
      // Clear flag and generate
      setLoadedComponentData(null);
      
      // Wait for React to complete state updates
      setTimeout(() => {
        generateGraph();
      }, 200);
    }
  }
}, [loadedComponentData, selectedGraphs, selectedSeries, availableSeries, 
    selectedType, selectedAggregate, generateGraph]);
```

### Why setTimeout?

React state updates are asynchronous and batched. The 200ms delay ensures:
1. All state updates have been processed
2. The component has re-rendered with the new state
3. The `generateGraph()` function has access to the latest state values

---

## Key Technical Challenges & Solutions

### Challenge 1: Asynchronous State Updates

**Problem:**
Calling `generateGraph()` immediately after setting state resulted in the error "Please select at least one graph type" because the state hadn't updated yet.

**Solution:**
- Introduced `loadedComponentData` state as a trigger
- Created a dedicated effect that monitors state changes
- Uses validation to ensure all data is ready before generation
- Implements a timeout to allow React's update cycle to complete

### Challenge 2: Data Types Not Loaded for GENR Dashboard

**Problem:**
In GENR dashboards, data types are only loaded when the user expands a machine's accordion. In edit mode, we need them loaded immediately.

**Solution:**
- Explicitly call `fetchDataTypesForMachine()` for each machine in the component
- Wait for all data types to load using `Promise.all`
- Automatically expand the relevant machine accordions

### Challenge 3: Unique Graph ID Management

**Problem:**
Multiple machines can have data types with the same ID, causing conflicts.

**Solution:**
- Created unique IDs by combining machine name and graph ID: `${machineName}_${graphId}`
- Stored original IDs in a separate map for API calls
- Convert back to original IDs when generating data

### Challenge 4: Series Data Synchronization

**Problem:**
Series data needed to be fetched and selected series needed to be set, but these are separate async operations.

**Solution:**
- Fetch all series data in parallel using `Promise.all`
- Collect all series selections
- Set all selected series in a single batch update
- Use the auto-generation effect to wait for all updates to complete

---

## User Interface Changes

### Visual Indicators in Edit Mode

1. **Selected Data Types**: Display with blue border and checkmark
2. **Selected Series**: Highlighted in blue
3. **Expanded Accordions**: Automatically opened for relevant machines
4. **Type Dropdown**: Pre-selected (Graph or Stat)
5. **Aggregation Radio Buttons**: Pre-selected (Max, Min, or Mean)
6. **Auto-Generated Graph**: Appears automatically after loading

### Button Label Change

The "Add to Dashboard" button changes based on mode:
```javascript
{isEditMode ? 'Update Component' : 'Add to Dashboard'}
```

---

## API Service Methods

**File:** `src/services/apiService.js`

### Get Single Component
```javascript
async getComponent(componentId) {
  const url = `${API_BASE_URL}/api/components/${componentId}/`;
  return this.fetchWithErrorHandling(url, {
    method: 'GET',
  });
}
```

### Update Component
```javascript
async updateComponent(componentId, componentData) {
  const url = `${API_BASE_URL}/api/components/${componentId}/update/`;
  return this.fetchWithErrorHandling(url, {
    method: 'PUT',
    body: JSON.stringify(componentData),
  });
}
```

---

## Testing Checklist

### Functional Testing

- [ ] Edit button appears on components in DashboardSummary
- [ ] Clicking edit navigates to ComponentBuilder with correct parameters
- [ ] Component type is correctly pre-selected
- [ ] Aggregation method is correctly pre-selected
- [ ] Selected graphs are highlighted with checkmarks
- [ ] Selected series are highlighted
- [ ] Machine accordions expand automatically
- [ ] Graph generates automatically after loading
- [ ] Modify selections and verify changes are reflected
- [ ] Update button saves changes correctly
- [ ] Updated component displays correctly in DashboardSummary

### Edge Cases

- [ ] Edit component with single graph
- [ ] Edit component with multiple graphs from different machines
- [ ] Edit component with no series (has_pivot=false)
- [ ] Edit Stat type component (should limit to 1 series)
- [ ] Edit component from MACH dashboard (machine-specific)
- [ ] Edit component from GENR dashboard (multi-machine)
- [ ] Cancel edit and verify no changes saved

### Browser Console Testing

Check console logs for:
- "Component loaded for edit" message
- Correct vQuery structure
- Machines being loaded
- Unique graph IDs created
- Series data being fetched
- "Auto-generating graph with loaded data" message

---

## Error Handling

### Potential Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "Please select at least one graph type" | Graph generation called too early | Auto-generation effect validates data first |
| Data types not showing | Not loaded for GENR dashboard | Explicitly fetch via `fetchDataTypesForMachine()` |
| Series not selected | State update timing issue | Batch update all series at once |
| Graph not generating | Missing required data | Validation check in auto-generation effect |
| Component not found | Invalid component_id | API returns 404, display error message |

---

## Performance Considerations

1. **Parallel Data Loading**: Uses `Promise.all` to fetch data for multiple machines simultaneously
2. **Batch State Updates**: Sets all selections at once rather than one-by-one
3. **Conditional Loading**: Only loads data types for machines that aren't already loaded
4. **Debounced Generation**: 200ms timeout prevents multiple rapid generation attempts

---

## Future Enhancements

### Potential Improvements

1. **Loading Indicators**: Show progress while loading component data
2. **Unsaved Changes Warning**: Alert user if navigating away with unsaved changes
3. **Version History**: Track component edit history
4. **Duplicate Component**: Add option to duplicate and edit existing component
5. **Batch Edit**: Edit multiple components at once
6. **Template System**: Save component configurations as templates

---

## Related Files

### Frontend
- `src/pages/ComponentBuilder.jsx` - Main edit implementation
- `src/pages/DashboardSummary.jsx` - Edit button and navigation
- `src/hooks/useComponentBuilderData.js` - Data management hook
- `src/services/apiService.js` - API communication
- `src/components/forms/AddComponentForm.jsx` - Save/update form

### Backend
- `backend/workshopviz/views.py` - API endpoints
  - `get_component()`
  - `update_component()`
- `backend/workshopviz/mysql_service.py` - Database operations

---

## Code Examples

### Complete loadComponentForEdit Function

```javascript
const loadComponentForEdit = async (compId) => {
  try {
    const response = await apiService.getComponent(compId);
    if (response.success) {
      const component = response.data || response.component;
      setComponentToEdit(component);
      const vQuery = component.vQuery;
      
      console.log('Component loaded for edit:', component);
      console.log('vQuery:', vQuery);
      
      if (vQuery) {
        // Set type and aggregate
        if (vQuery.type) {
          setSelectedType(vQuery.type);
        }
        if (vQuery.aggregate) {
          const capitalizedAggregate = vQuery.aggregate.charAt(0).toUpperCase() + 
                                       vQuery.aggregate.slice(1);
          setSelectedAggregate(capitalizedAggregate);
        }
        
        // Set time range
        if (vQuery.range) {
          setTimeRange(vQuery.range);
        }
        
        if (vQuery.graphs && vQuery.machine_names) {
          const graphsArray = vQuery.graphs;
          const machineNamesArray = vQuery.machine_names;
          
          // Load data types for GENR dashboard
          if (!machineName) {
            await Promise.all(
              machineNamesArray.map(machine => fetchDataTypesForMachine(machine))
            );
          }
          
          // Create unique graph IDs
          const uniqueGraphIds = graphsArray.map((graphId, index) => {
            return `${machineNamesArray[index]}_${graphId}`;
          });
          
          setSelectedGraphs(uniqueGraphIds);
          
          // Build graph to machine map
          const graphMap = {};
          uniqueGraphIds.forEach((uniqueId, index) => {
            graphMap[uniqueId] = machineNamesArray[index];
          });
          setGraphToMachineMap(graphMap);
          
          // Expand machines
          const uniqueMachines = [...new Set(machineNamesArray)];
          setExpandedMachines(uniqueMachines);
          
          // Fetch and set series
          const seriesPromises = uniqueGraphIds.map(async (uniqueGraphId, index) => {
            const originalGraphId = graphsArray[index];
            const machineNameForGraph = machineNamesArray[index];
            
            await fetchAvailableSeries(uniqueGraphId, machineNameForGraph);
            
            return {
              graphId: uniqueGraphId,
              originalGraphId: originalGraphId,
              series: vQuery.series?.[originalGraphId] || []
            };
          });
          
          const seriesData = await Promise.all(seriesPromises);
          
          const newSelectedSeries = {};
          seriesData.forEach(item => {
            if (item.series.length > 0) {
              newSelectedSeries[item.graphId] = item.series;
            }
          });
          setSelectedSeries(newSelectedSeries);
          
          // Trigger auto-generation
          setLoadedComponentData({
            uniqueGraphIds,
            seriesData: newSelectedSeries,
            vQuery
          });
        }
      }
    }
  } catch (error) {
    console.error('Failed to load component:', error);
    alert('Failed to load component for editing');
  }
};
```

---

## Debugging Guide

### Enable Console Logging

The implementation includes extensive console logging. Check the browser console for:

```
Component loaded for edit: {object}
vQuery: {object}
Current machineName prop: "Cincinnati"
Set type to: "Graph"
Set aggregate to: "Max"
Set time range to: "3h"
Loading data for machines: ["Cincinnati"]
Unique graph IDs: ["Cincinnati_1"]
Graph to machine map: {"Cincinnati_1": "Cincinnati"}
Expanded machines: ["Cincinnati"]
Fetching series for all graphs...
Fetching series for graph Cincinnati_1 (machine: Cincinnati)
Series for Cincinnati_1: ["X-Axis", "Y-Axis", "Z-Axis", "Spindle"]
All series data loaded: [...]
Selected series set to: {"Cincinnati_1": ["X-Axis", "Y-Axis"]}
Loaded component data set - will trigger auto-generation
Auto-generating graph with loaded data: {object}
```

### Common Issues

1. **No data types showing**
   - Check if `machineDataTypes` state has data for the machine
   - Verify `fetchDataTypesForMachine()` was called
   - Check network tab for API call success

2. **Series not pre-selected**
   - Verify series data exists in vQuery
   - Check console for "Selected series set to" log
   - Confirm series names match available series

3. **Graph not generating**
   - Check "Auto-generating graph" console log appears
   - Verify `loadedComponentData` is set
   - Check if validation in auto-generation effect is passing

---

## Summary

The component edit feature provides a seamless experience for users to modify existing dashboard components. The implementation handles complex state management, asynchronous data loading, and ensures all data is properly synchronized before attempting to render the visualization. The use of extensive logging and validation makes the feature robust and debuggable.

### Key Achievements

✅ Seamless edit mode detection and activation  
✅ Complete pre-population of all form fields  
✅ Automatic data loading for GENR dashboards  
✅ Proper handling of asynchronous state updates  
✅ Automatic graph generation after loading  
✅ Support for both MACH and GENR dashboard types  
✅ Comprehensive error handling and logging  
✅ Maintains header visibility for dashboard context  

---

**Document Version:** 1.0  
**Last Updated:** December 12, 2025  
**Author:** Workshop Visualization Team
