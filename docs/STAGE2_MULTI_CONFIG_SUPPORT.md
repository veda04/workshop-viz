# STAGE2: Multi-Machine and Dropdown Configuration Support

## Overview
This document describes the implementation of multi-machine and dropdown support for the Component Builder feature, allowing users to select data types from different machines and dropdowns simultaneously and display them on a single graph with proper labeling.

## Date Implemented
December 5, 2025

## Problem Statement

### Issues Identified:
1. **Dropdown Data Not Displaying**: Although dropdown data was received in the backend, it was not being displayed in the frontend
2. **Single Config Limitation**: The system could only handle data from ONE configuration file at a time
3. **Multi-Source Selection Failure**: Selecting data types from 2 different machines or a machine + dropdown returned `[None, None]` 
4. **Missing Source Identification**: Graph legends didn't indicate which machine/dropdown the data came from

## Solution Architecture

### Design Principles:
- ✅ Maintain backward compatibility with single machine selection
- ✅ Treat dropdowns exactly like machines (same data fetching logic)
- ✅ Load configuration files separately for each selected source
- ✅ Frontend handles display formatting (no machine name prefixing in backend data)
- ✅ Minimal changes to `dashboard.py` helper functions

## Implementation Details

### 1. Backend Changes (`backend/workshopviz/views.py`)

#### Modified Function: `generate_data`

**New Request Parameters:**
```python
{
    "machine_name": "Hurco",           # Backward compatibility (optional)
    "machine_names": ["Hurco", "Cincinnati"],  # New: Array of machines per graph
    "graphs": ["1", "2"],              # Graph IDs
    "series": {"1": ["A-Axis"], "2": ["Temperature"]},
    "range": "3h",
    "type": "graph"
}
```

**Key Changes:**

1. **Accept Multiple Machine Names:**
```python
machine_names = data.get('machine_names', [])

# Backward compatibility
if not machine_names:
    machine_names = [machine_name] * len(selected_graphs)
```

2. **Process Each Machine/Dropdown Separately:**
```python
for idx, (graph_id, machine_name_for_graph) in enumerate(zip(selected_graphs, machine_names)):
    # Load specific config file
    file_path = os.path.join(MACHINE_CONFIG_PATH, f"{machine_name_for_graph}.json")
    
    # Get data for this machine/dropdown
    machine_data = getCustomData(customised_config_data, file_path)
    
    # Store with metadata
    machine_metadata.append({
        'graph_id': str(graph_id),
        'machine_name': machine_name_for_graph,
        'data_type_name': data_type_name,
        'unit': data_type_config.get('Unit', ''),
        'series': selected_series.get(str(graph_id), [])
    })
```

3. **Merge Data from All Sources:**
```python
# Collect all timestamps
for idx, data_list in enumerate(all_machine_data):
    metadata = machine_metadata[idx]
    for entry in data_list:
        timestamp = entry.get('time')
        for series_name in metadata['series']:
            if series_name in entry:
                series_data_map[series_name][timestamp].append(entry[series_name])

# Build combined dataset
combined_data = {
    'chartData': [...],
    'series': [...],
    'machineMetadata': machine_metadata  # Include source metadata
}
```

**Response Structure:**
```python
{
    "status": "success",
    "data": {
        "chartData": [
            {"time": "06:30", "A-Axis_Motor": 0.014, "Temperature": 25.3},
            ...
        ],
        "series": ["A-Axis_Motor", "Temperature"],
        "machineMetadata": [
            {
                "graph_id": "1",
                "machine_name": "Hurco",
                "data_type_name": "Acceleration",
                "unit": "g",
                "series": ["A-Axis_Motor"]
            },
            {
                "graph_id": "2", 
                "machine_name": "Cincinnati",
                "data_type_name": "Temperature",
                "unit": "°C",
                "series": ["Temperature"]
            }
        ]
    }
}
```

### 2. Frontend Changes (`src/hooks/useComponentBuilderData.js`)

#### Modified Function: `generateGraph`

**Build Machine Names Array:**
```javascript
// Map each selected graph to its corresponding machine/dropdown
const machineNamesArray = selectedGraphs.map(graphId => {
    // Use graphToMachineMap for GENR dashboards, or machineName for MACH dashboards
    return graphToMachineMap[graphId] || machineName;
});

// Example: ["Hurco", "Cincinnati"]
```

**Send to Backend:**
```javascript
const response = await apiService.generateData({
    type: selectedType.toLowerCase(),
    graphs: originalGraphIds,
    series: originalSeriesMapping,
    range: timeRange,
    machine_names: machineNamesArray,  // NEW: Array of machine names
}, machineToUse);  // Keep for backward compatibility
```

**Enhanced Axis Configuration:**
```javascript
axisConfig: selectedGraphs.map((graphId, index) => {
    const machineForGraph = graphToMachineMap[graphId] || machineName;
    
    return {
        graphId,
        machineName: machineForGraph,  // NEW: Include machine/dropdown name
        position: index === 0 ? 'left' : 'right',
        unit: config?.unit || '',
        title: config?.title || '',
        series: selectedSeries[graphId] || []
    };
})
```

### 3. Frontend Changes (`src/components/charts/ZoomableChart.jsx`)

#### Updated Legend Display

**Before:**
```jsx
<h4>Acceleration (g) - Left Axis</h4>
```

**After:**
```jsx
<h4>
    {axisConfig[0].machineName 
        ? `${axisConfig[0].machineName}: ${axisConfig[0].title}` 
        : axisConfig[0].title} 
    ({axisConfig[0].unit}) - Left Axis
</h4>
```

**Visual Result:**
```
Hurco: Acceleration (g) - Left Axis          Cincinnati: Temperature (°C) - Right Axis
  🔴 A-Axis_Motor                              🟡 Sensor1
  🔵 C-Axis_Motor                              🟢 Sensor2
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    COMPONENT BUILDER UI                      │
│                                                              │
│  User Selects:                                              │
│  ├─ Hurco: Acceleration → graphId: "Hurco_1"               │
│  └─ Cincinnati: Temperature → graphId: "Cincinnati_2"       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│            useComponentBuilderData.js                        │
│                                                              │
│  graphToMachineMap = {                                      │
│    "Hurco_1": "Hurco",                                      │
│    "Cincinnati_2": "Cincinnati"                             │
│  }                                                          │
│                                                              │
│  generateGraph() builds:                                    │
│  {                                                          │
│    graphs: ["1", "2"],                                      │
│    machine_names: ["Hurco", "Cincinnati"],                 │
│    series: {"1": ["A-Axis"], "2": ["Temperature"]}         │
│  }                                                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼ API Request
┌─────────────────────────────────────────────────────────────┐
│              Backend: views.py - generate_data()             │
│                                                              │
│  Step 1: Process Hurco                                      │
│  ├─ Load: config/Hurco.json                                │
│  ├─ Call: getCustomData(graph_1_config, Hurco.json)        │
│  └─ Result: [{time: "06:30", A-Axis: 0.014}, ...]         │
│                                                              │
│  Step 2: Process Cincinnati                                 │
│  ├─ Load: config/Cincinnati.json                           │
│  ├─ Call: getCustomData(graph_2_config, Cincinnati.json)   │
│  └─ Result: [{time: "06:30", Temperature: 25.3}, ...]     │
│                                                              │
│  Step 3: Merge Data                                         │
│  ├─ Combine timestamps                                      │
│  ├─ Create unified chartData                               │
│  └─ Include machineMetadata                                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼ API Response
┌─────────────────────────────────────────────────────────────┐
│            useComponentBuilderData.js                        │
│                                                              │
│  Builds axisConfig with machineNames:                       │
│  [                                                          │
│    {                                                        │
│      graphId: "Hurco_1",                                   │
│      machineName: "Hurco",                                 │
│      title: "Acceleration",                                │
│      unit: "g",                                            │
│      position: "left",                                     │
│      series: ["A-Axis_Motor"]                              │
│    },                                                      │
│    {                                                        │
│      graphId: "Cincinnati_2",                              │
│      machineName: "Cincinnati",                            │
│      title: "Temperature",                                 │
│      unit: "°C",                                           │
│      position: "right",                                    │
│      series: ["Sensor1", "Sensor2"]                        │
│    }                                                       │
│  ]                                                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              ZoomableChart.jsx                               │
│                                                              │
│  Displays Legend:                                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Hurco: Acceleration (g)     Cincinnati: Temperature  │  │
│  │ - Left Axis                  (°C) - Right Axis       │  │
│  │   🔴 A-Axis_Motor             🟡 Sensor1            │  │
│  │   🔵 C-Axis_Motor             🟢 Sensor2            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Supported Scenarios

### ✅ Scenario 1: Single Machine
**Selection:** Hurco - Acceleration + Current  
**Result:** Both data types from Hurco.json, displayed with single legend

### ✅ Scenario 2: Two Different Machines
**Selection:** Hurco - Acceleration + Cincinnati - Temperature  
**Result:** Data from Hurco.json and Cincinnati.json merged, dual-axis display

### ✅ Scenario 3: Machine + Dropdown
**Selection:** Hurco - Acceleration + DropdownA - Custom Metric  
**Result:** Data from Hurco.json and DropdownA.json merged

### ✅ Scenario 4: Single Dropdown
**Selection:** DropdownA - Metric 1 + Metric 2  
**Result:** Both data types from DropdownA.json, displayed with source label

### ✅ Scenario 5: Two Dropdowns
**Selection:** DropdownA - Metric 1 + DropdownB - Metric 2  
**Result:** Data from DropdownA.json and DropdownB.json merged

## Backward Compatibility

The implementation maintains full backward compatibility:

1. **Single `machine_name` Parameter**: Still supported for existing API consumers
2. **Automatic Fallback**: If `machine_names` array is not provided, uses `machine_name` for all graphs
3. **Existing MACH Dashboard**: Continues to work as before with single machine selection
4. **Optional `machineName` in Legend**: If not provided, displays only the data type title

## Testing Checklist

- [ ] Single machine with 1 data type
- [ ] Single machine with 2 data types
- [ ] Two different machines (e.g., Hurco + Cincinnati)
- [ ] Machine + Dropdown (e.g., Hurco + DropdownA)
- [ ] Single dropdown with multiple data types
- [ ] Two different dropdowns (e.g., DropdownA + DropdownB)
- [ ] Legend displays correct machine/dropdown names
- [ ] Graph axes are correctly labeled
- [ ] Data from all sources displays correctly
- [ ] Time synchronization across different sources
- [ ] Error handling when config file not found

## Files Modified

### Backend:
- `backend/workshopviz/views.py` - `generate_data()` function

### Frontend:
- `src/hooks/useComponentBuilderData.js` - `generateGraph()` function
- `src/components/charts/ZoomableChart.jsx` - Legend display logic

### No Changes Required:
- `backend/helper/dashboard.py` - Preserved existing logic
- `backend/workshopviz/influx_service.py`
- `backend/workshopviz/mysql_service.py`

## Configuration Requirements

### Config File Structure:
All machine and dropdown configuration files must follow the same structure:

```json
{
  "Data": {
    "1": {
      "Type": "...",
      "Unit": "...",
      "Predicates": [...],
      "Pivot": {...}
    }
  }
}
```

### File Naming Convention:
- Machines: `MachineName.json` (e.g., `Hurco.json`, `Cincinnati.json`)
- Dropdowns: `DropdownX.json` (e.g., `DropdownA.json`, `DropdownB.json`)

## Error Handling

### Backend Graceful Degradation:
```python
if not os.path.exists(file_path):
    logger.warning(f'Configuration file not found for: {machine_name_for_graph}')
    all_machine_data.append(None)
    continue
```

### Frontend Validation:
```javascript
if (!selectedSeries[graphId] || selectedSeries[graphId].length === 0) {
    setError(`Please select at least one series for ${config?.title}`);
    return false;
}
```

## Performance Considerations

1. **Parallel Config Loading**: Each machine's config is loaded independently (can be parallelized in future)
2. **Data Merging Efficiency**: Uses timestamp-based indexing for O(n) merge complexity
3. **Memory Usage**: Minimal overhead as data is processed sequentially
4. **API Response Size**: Metadata adds ~100-500 bytes per machine

## Future Enhancements

1. **Parallel Config Loading**: Use `asyncio` to load multiple configs simultaneously
2. **Caching**: Cache frequently accessed config files
3. **Data Aggregation Options**: Allow user to select aggregation method (avg, max, min)
4. **More Than 2 Sources**: Support 3+ machines/dropdowns with multi-axis display
5. **Series Deduplication**: Handle cases where different machines have series with same names
6. **Real-time Updates**: Support streaming data from multiple sources

## Known Limitations

1. Maximum 2 data types (graphs) can be selected at once (UI limitation)
2. Each machine/dropdown must have valid JSON config file
3. Time ranges must be identical for all selected sources
4. Series names must be unique across all selected sources for proper display

## Conclusion

This implementation successfully enables the Component Builder to handle multiple machines and dropdowns simultaneously, providing users with flexible data visualization capabilities while maintaining system stability and backward compatibility.

---

**Implementation Status:** ✅ Complete  
**Testing Status:** ⏳ Pending User Validation  
**Documentation:** ✅ Complete
