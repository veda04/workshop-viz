# STAGE 2 - Dashboard Entry Builder Implementation

## Overview
This document details the implementation of Stage 2, which focuses on building the dashboard entry creation interface with machine accordions, data type selection, series configuration, and graph generation. This stage enables users to create custom visualizations by selecting data types from multiple machines and configuring their series.

**Implementation Date:** December 4, 2025

---

## Table of Contents
1. [User Flow](#user-flow)
2. [Architecture Overview](#architecture-overview)
3. [Key Features](#key-features)
4. [Implementation Details](#implementation-details)
5. [Bug Fixes and Refinements](#bug-fixes-and-refinements)
6. [File Structure](#file-structure)
7. [API Integration](#api-integration)
8. [Testing Guide](#testing-guide)

---

## User Flow

### Complete Entry Creation Flow
```
Dashboard Summary Page
   ↓
Click "Create New Entry" Button
   ↓
Navigate to: /component-builder?dashboardId={id}&machineName={name}
   (machineName present = MACH, absent = GENR)
   ↓
Component Builder Page Loads
   ↓
User Interface Components:
   1. Left Panel: Data Type Selection
      - Select Type Dropdown (Graph/Stats/Info)
      - Machine Accordions (expandable/collapsible)
      - Dropdown Accordions (from config files)
      - Selection Counter (X/2)
   
   2. Center Panel: Series Configuration & Graph Display
      - Configure Series Accordion (collapsible)
      - Series selection buttons per data type
      - Generate button
      - Graph visualization (after generation)
      - Add to Dashboard button
   ↓
User Workflow:
   1. Select visualization type (default: Graph)
   2. Expand machine/dropdown accordions (lazy loading)
   3. Select up to 2 data types (global limit)
   4. Configure series for each selected data type
   5. Click "Generate" to create visualization
   6. Click "Add to Dashboard" to save
```

---

## Architecture Overview

### Component Structure
```
ComponentBuilder.jsx (Main UI Component)
   ├── useComponentBuilderData.js (Custom Hook - Data Management)
   │   ├── State Management (graphConfigs, machines, selectedGraphs, etc.)
   │   ├── Data Fetching Functions
   │   │   ├── fetchDataTypesForMachine()
   │   │   ├── fetchAvailableSeries()
   │   │   └── generateGraph()
   │   └── Unique ID System (machine prefixing)
   │
   ├── Left Panel Components
   │   ├── Type Selector (Dropdown)
   │   ├── MACH Dashboard Section (single machine)
   │   ├── GENR Dashboard Section (multiple machines)
   │   └── Dropdown Section (both modes)
   │
   └── Center Panel Components
       ├── Configure Series Accordion
       │   ├── Series Selection Grid
       │   └── Generate Button
       └── Graph Display
           ├── OverviewChart Component
           └── Add to Dashboard Button
```

### Data Flow Architecture
```
User Action → ComponentBuilder.jsx → useComponentBuilderData.js → API Call
                                            ↓
                                    State Update
                                            ↓
                                    UI Re-render
                                            ↓
                                    Visual Feedback
```

---

## Key Features

### 1. Unified Accordion Structure
**Purpose:** Consistent UI/UX across all dashboard types

**Implementation:**
- Both MACH (machine-specific) and GENR (generic) dashboards use identical nested accordion structure
- All accordions start collapsed by default for consistency
- Unified toggle mechanism using `toggleMachine()` function
- Shared state management via `expandedMachines` array

**Components:**
- **MACH Dashboard:** Single machine accordion with its data types
- **GENR Dashboard:** Multiple machine accordions, each with its data types
- **Dropdown Section:** Separate accordions for config-based dropdowns

### 2. Unique ID System
**Problem:** Data types from different machines had identical IDs (e.g., both Cincinnati and Hurco had "Acceleration" with ID "1"), causing selection collisions.

**Solution:** Machine-prefixed unique ID system
```javascript
// Format
Regular Data Type:  MachineName_OriginalId
Example:           "Cincinnati_1", "Hurco_1"

Dropdown Data Type: MachineName_dropdown_OriginalId
Example:           "Cincinnati_dropdown_temp", "DropdownA_dropdown_temp"
```

**Implementation Details:**
- **Frontend:** Uses unique IDs for all selection tracking and UI state
- **Backend:** Receives original IDs (extracted from unique IDs)
- **Mapping:** `graphToMachineMap` tracks which machine each selection belongs to
- **Storage:** Each data type stores both `id` (unique) and `originalId` (for API calls)

### 3. Global Selection Limit
**Requirement:** Users can select maximum 2 data types across ALL machines and dropdowns

**Implementation:**
```javascript
// Selection Enforcement
if (selectedGraphs.length >= 2 && !selectedGraphs.includes(id)) {
  // Disable selection
  opacity-50 cursor-not-allowed
}

// Click Handler
onClick={() => {
  if (selectedGraphs.length < 2 || selectedGraphs.includes(id)) {
    handleGraphSelection(id, machineName);
  }
}}
```

**Visual Feedback:**
- Counter display: `(X/2)` next to "Select Data Types" header
- Disabled items: 50% opacity, cursor-not-allowed
- Selected items: Blue border, blue background, checkmark icon
- Enabled items: Gray border, hover effects

### 4. Lazy Loading Pattern
**Purpose:** Performance optimization - load data types only when needed

**Implementation:**
```javascript
const toggleMachine = async (machine) => {
  if (expandedMachines.includes(machine)) {
    // Collapse: Remove from expanded array
    setExpandedMachines(prev => prev.filter(m => m !== machine));
  } else {
    // Expand: Add to array and fetch data if not already loaded
    setExpandedMachines(prev => [...prev, machine]);
    if (!machineDataTypes[machine]) {
      await fetchDataTypesForMachine(machine);
    }
  }
};
```

**Benefits:**
- Reduces initial load time
- Prevents unnecessary API calls
- Data cached after first load
- Smooth user experience

### 5. Dropdown Integration
**Purpose:** Display additional data types from config files (e.g., environmental data)

**Source:** `GET /api/dropdowns-from-config/` returns dropdown names like "DropdownA"

**Implementation:**
- Dropdowns displayed in both MACH and GENR modes
- Each dropdown has its own accordion section
- Data types lazy-loaded from config files (e.g., Temperature, PM2.5, Humidity)
- Uses same selection mechanism and ID system as machine data types
- Counts toward global 2-item selection limit

### 6. Series Configuration
**Purpose:** Allow users to select specific series (axes) for each data type

**Flow:**
1. User selects data type → API fetches available series
2. Series displayed as button grid (2-4 columns)
3. User clicks series buttons to toggle selection
4. Multiple series can be selected per data type
5. Selected series highlighted with blue background

**API Call:**
```javascript
GET /api/available-series/?machine_name=Cincinnati&graph_id=1
```

**Response:**
```json
["X-Axis_Motor", "Y-Axis_Motor", "Z-Axis_Motor", "Spindle"]
```

---

## Implementation Details

### File: `useComponentBuilderData.js`
**Location:** `src/hooks/useComponentBuilderData.js`

**Purpose:** Custom React hook encapsulating all data management logic for ComponentBuilder

#### State Variables
```javascript
// Core Data
const [graphConfigs, setGraphConfigs] = useState([]);           // MACH mode data types
const [machines, setMachines] = useState([]);                   // Available machines
const [machineDataTypes, setMachineDataTypes] = useState({});   // GENR mode data types
const [graphToMachineMap, setGraphToMachineMap] = useState({}); // Maps graphId → machineName
const [dropdowns, setDropdowns] = useState([]);                 // Dropdown names

// Selection State
const [selectedGraphs, setSelectedGraphs] = useState([]);       // Selected data type IDs (max 2)
const [selectedSeries, setSelectedSeries] = useState({});       // graphId → [seriesNames]
const [availableSeries, setAvailableSeries] = useState({});     // graphId → [available series]

// UI State
const [expandedMachines, setExpandedMachines] = useState([]);   // Which accordions are open
const [loading, setLoading] = useState(true);
const [loadingDataTypes, setLoadingDataTypes] = useState({});   // Per-machine loading state
const [loadingSeries, setLoadingSeries] = useState({});         // Per-graph loading state
const [generatingGraph, setGeneratingGraph] = useState(false);

// Generated Data
const [graphData, setGraphData] = useState(null);               // Generated visualization data
```

#### Key Functions

##### `fetchDataTypesForMachine(machine)`
**Purpose:** Fetch and process data types for a specific machine or dropdown

**Process:**
1. Check if already loaded (cached in `machineDataTypes`)
2. Set loading state for specific machine
3. Call API: `GET /api/data-types/?machine_name={machine}`
4. Transform data: Add unique IDs with machine prefix
5. Fetch dropdowns if not already loaded
6. Append dropdown data types to machine's data types
7. Store in `machineDataTypes[machine]`

**Code:**
```javascript
const fetchDataTypesForMachine = async (machine) => {
  if (machineDataTypes[machine]) return;
  
  setLoadingDataTypes(prev => ({ ...prev, [machine]: true }));
  
  try {
    // Fetch data types
    const response = await fetch(`${API_BASE_URL}/data-types/?machine_name=${machine}`);
    const data = await response.json();
    
    // Transform with unique IDs
    const transformedData = data.map(item => ({
      ...item,
      originalId: item.id,
      id: `${machine}_${item.id}`
    }));
    
    // Fetch dropdowns if not loaded
    if (dropdowns.length === 0) {
      await fetchDropdowns();
    }
    
    // Append dropdown data types
    const dropdownTypes = [];
    for (const dropdown of dropdowns) {
      const dropdownResponse = await fetch(`${API_BASE_URL}/data-types/?machine_name=${dropdown}`);
      const dropdownData = await dropdownResponse.json();
      
      dropdownData.forEach(item => {
        dropdownTypes.push({
          ...item,
          originalId: item.id,
          id: `${machine}_dropdown_${item.id}`
        });
      });
    }
    
    setMachineDataTypes(prev => ({
      ...prev,
      [machine]: [...transformedData, ...dropdownTypes]
    }));
  } finally {
    setLoadingDataTypes(prev => ({ ...prev, [machine]: false }));
  }
};
```

##### `handleGraphSelection(graphId, machineNameForGraph)`
**Purpose:** Handle data type selection/deselection

**Validation:**
- Enforce 2-item global limit
- Track machine association in `graphToMachineMap`
- Fetch series if newly selected
- Clear series if deselected

**Code:**
```javascript
const handleGraphSelection = (graphId, machineNameForGraph) => {
  setSelectedGraphs(prev => {
    if (prev.includes(graphId)) {
      // Deselect
      setAvailableSeries(current => {
        const updated = { ...current };
        delete updated[graphId];
        return updated;
      });
      setSelectedSeries(current => {
        const updated = { ...current };
        delete updated[graphId];
        return updated;
      });
      setGraphToMachineMap(current => {
        const updated = { ...current };
        delete updated[graphId];
        return updated;
      });
      return prev.filter(id => id !== graphId);
    } else {
      // Select (if under limit)
      if (prev.length >= 2) return prev;
      
      // Store machine association
      setGraphToMachineMap(current => ({
        ...current,
        [graphId]: machineNameForGraph
      }));
      
      // Fetch series
      fetchAvailableSeries(graphId, machineNameForGraph);
      
      return [...prev, graphId];
    }
  });
};
```

##### `fetchAvailableSeries(graphId, machineNameForGraph)`
**Purpose:** Fetch available series (axes) for a selected data type

**ID Extraction:**
```javascript
let originalId = graphId;

// Extract original ID from unique ID
if (graphId.includes('_dropdown_')) {
  originalId = graphId.split('_dropdown_')[1];
} else if (graphId.includes('_')) {
  originalId = graphId.split('_')[1];
}

// API call with original ID
const response = await fetch(
  `${API_BASE_URL}/available-series/?machine_name=${machineNameForGraph}&graph_id=${originalId}`
);
```

##### `generateGraph()`
**Purpose:** Generate visualization from selected data types and series

**Process:**
1. Validate selections (at least 1 data type and series selected)
2. Extract original IDs from unique IDs
3. Build payload with machine associations
4. Call API: `POST /api/generate-data/`
5. Store result in `graphData` state

**Payload Structure:**
```javascript
{
  graphIds: [
    { id: "1", machine: "Cincinnati" },
    { id: "2", machine: "Hurco" }
  ],
  seriesSelection: {
    "1": ["X-Axis", "Y-Axis"],
    "2": ["Spindle"]
  },
  timeRange: { value: 7, unit: 'days' },
  selectedType: 'Graph'
}
```

### File: `ComponentBuilder.jsx`
**Location:** `src/pages/ComponentBuilder.jsx`

**Purpose:** Main UI component for dashboard entry creation

#### Component Structure

##### 1. Type Selector
```jsx
<select
  value={selectedType}
  onChange={(e) => setSelectedType(e.target.value)}
  className="w-full px-4 py-2 rounded-lg border..."
>
  {custom_types.map((type) => (
    <option key={type} value={type}>{type}</option>
  ))}
</select>
```

##### 2. MACH Dashboard Section
**Condition:** `machineName` parameter present in URL

```jsx
{machineName && (
  <div className="space-y-3">
    <div className="border rounded-lg overflow-hidden">
      {/* Accordion Header */}
      <button onClick={() => toggleMachine(machineName)}>
        <h4>{machineName}</h4>
        <svg className={expandedMachines.includes(machineName) ? 'rotate-180' : ''} />
      </button>
      
      {/* Accordion Content */}
      <div className={expandedMachines.includes(machineName) ? 'max-h-[1000px]' : 'max-h-0'}>
        {graphConfigs.map((datatype) => (
          <div
            key={datatype.id}
            className={selectedGraphs.includes(datatype.id) ? 'border-blue-500' : ''}
            onClick={() => handleGraphSelection(datatype.id, machineName)}
          >
            <h3>{datatype.title} <span>({datatype.unit})</span></h3>
            <div className="checkbox-icon">
              {selectedGraphs.includes(datatype.id) && <CheckIcon />}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
)}
```

##### 3. GENR Dashboard Section
**Condition:** No `machineName` parameter in URL

```jsx
{!machineName && machines && machines.length > 0 && (
  <div className="space-y-3">
    {machines.map((machine) => {
      const machineName = machine.vName;
      const isExpanded = expandedMachines.includes(machineName);
      const dataTypes = machineDataTypes[machineName] || [];
      const isLoading = loadingDataTypes[machineName];
      
      return (
        <div key={machineName} className="border rounded-lg">
          {/* Accordion Header */}
          <button onClick={() => toggleMachine(machineName)}>
            <h4>{machineName}</h4>
            <svg className={isExpanded ? 'rotate-180' : ''} />
          </button>
          
          {/* Accordion Content */}
          <div className={isExpanded ? 'max-h-[1000px]' : 'max-h-0'}>
            {isLoading && <LoadingSpinner />}
            {!isLoading && dataTypes.map((datatype) => (
              <div
                key={datatype.id}
                onClick={() => {
                  if (selectedGraphs.length < 2 || selectedGraphs.includes(datatype.id)) {
                    handleGraphSelection(datatype.id, machineName);
                  }
                }}
              >
                <h3>{datatype.title} <span>({datatype.unit})</span></h3>
              </div>
            ))}
          </div>
        </div>
      );
    })}
  </div>
)}
```

##### 4. Dropdown Section
**Condition:** `dropdowns` array has items

```jsx
{dropdowns && dropdowns.length > 0 && (
  <div className="space-y-3 mt-3">
    {dropdowns.map((dropdown) => {
      const dropdownName = dropdown;
      const isExpanded = expandedMachines.includes(dropdownName);
      const dataTypes = machineDataTypes[dropdownName] || [];
      const isLoading = loadingDataTypes[dropdownName];
      
      return (
        <div key={dropdownName} className="border rounded-lg">
          {/* Accordion Header */}
          <button onClick={() => toggleMachine(dropdownName)}>
            <h4>{dropdownName}</h4>
            <svg className={isExpanded ? 'rotate-180' : ''} />
          </button>
          
          {/* Accordion Content */}
          <div className={isExpanded ? 'max-h-[1000px]' : 'max-h-0'}>
            {/* CRITICAL FIX: Use dropdownName instead of machineName */}
            <div onClick={() => handleGraphSelection(datatype.id, dropdownName)}>
              <h3>{datatype.title}</h3>
            </div>
          </div>
        </div>
      );
    })}
  </div>
)}
```

##### 5. Configure Series Section
```jsx
<div className="bg-white rounded-lg shadow-md overflow-hidden">
  {/* Collapsible Header */}
  <button onClick={() => setIsAccordionOpen(!isAccordionOpen)}>
    <h2>Configure Series</h2>
    <svg className={isAccordionOpen ? 'rotate-180' : ''} />
  </button>
  
  {/* Content */}
  <div className={isAccordionOpen ? 'max-h-[2000px]' : 'max-h-0'}>
    {selectedGraphs.map((graphId) => {
      const config = /* Find config from graphConfigs or machineDataTypes */;
      const series = availableSeries[graphId] || [];
      const machineName = graphToMachineMap[graphId];
      
      return (
        <div key={graphId}>
          {/* Machine Badge */}
          {machineName && (
            <span className="bg-purple-100 text-purple-800">
              {machineName}
            </span>
          )}
          
          {/* Data Type Badge */}
          <span className="bg-blue-100 text-blue-800">
            {config?.title}
          </span>
          
          {/* Series Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {series.map((seriesName) => (
              <button
                key={seriesName}
                onClick={() => handleSeriesSelection(graphId, seriesName)}
                className={selectedSeries[graphId]?.includes(seriesName) 
                  ? 'bg-blue-500 text-white' 
                  : 'border-gray-300'}
              >
                {seriesName}
              </button>
            ))}
          </div>
        </div>
      );
    })}
    
    {/* Generate Button */}
    <button
      onClick={handleGenerateGraph}
      disabled={generatingGraph || selectedGraphs.length === 0}
      className="w-full bg-blue-600 text-white"
    >
      {generatingGraph ? 'Generating...' : 'Generate'}
    </button>
  </div>
</div>
```

### File: `DashboardSummary.jsx`
**Location:** `src/pages/DashboardSummary.jsx`

**Changes Made:**
- Fixed "Assignment to constant variable" error
- Changed `const componentBuilderUrl` to `let componentBuilderUrl` (line 38)

**Before:**
```javascript
const componentBuilderUrl = `/component-builder?dashboardId=${dashboardId}`;
if (dashboardData.vName) {
  componentBuilderUrl += `&machineName=${dashboardData.vName}`;
}
```

**After:**
```javascript
let componentBuilderUrl = `/component-builder?dashboardId=${dashboardId}`;
if (dashboardData.vName) {
  componentBuilderUrl += `&machineName=${dashboardData.vName}`;
}
```

---

## Bug Fixes and Refinements

### Issue 1: Assignment to Constant Variable Error
**Symptom:** Runtime error when navigating to Dashboard Summary page

**Error Message:**
```
Uncaught TypeError: Assignment to constant variable.
    at DashboardSummary.jsx:40
```

**Root Cause:** Attempting to reassign `const componentBuilderUrl` with `+=` operator

**Solution:**
- Changed `const` to `let` for `componentBuilderUrl` variable
- File: `DashboardSummary.jsx`, line 38

**Status:** ✅ Fixed

---

### Issue 2: ID Collision Between Machines
**Symptom:** Selecting "Acceleration" from Cincinnati also selected "Acceleration" from Hurco

**Root Cause:** 
- Both machines had data types with identical IDs from their config files
- Cincinnati config: `{ id: "1", title: "Acceleration" }`
- Hurco config: `{ id: "1", title: "Acceleration" }`
- Selection state used ID as key, causing collision

**Solution Implemented:**
1. **Unique ID Generation:** Create machine-prefixed IDs
   ```javascript
   id: `${machineName}_${originalId}`  // "Cincinnati_1", "Hurco_1"
   ```

2. **Original ID Storage:** Keep original for API compatibility
   ```javascript
   {
     id: "Cincinnati_1",      // Unique ID for frontend
     originalId: "1",         // Original ID for backend
     title: "Acceleration",
     unit: "m/s²"
   }
   ```

3. **Machine Mapping:** Track machine ownership
   ```javascript
   graphToMachineMap = {
     "Cincinnati_1": "Cincinnati",
     "Hurco_1": "Hurco"
   }
   ```

4. **ID Conversion in API Calls:** Extract original ID before sending
   ```javascript
   // In fetchAvailableSeries()
   let originalId = graphId;
   if (graphId.includes('_dropdown_')) {
     originalId = graphId.split('_dropdown_')[1];
   } else if (graphId.includes('_')) {
     originalId = graphId.split('_')[1];
   }
   ```

**Files Modified:**
- `useComponentBuilderData.js`: Added ID transformation and mapping logic

**Status:** ✅ Fixed

---

### Issue 3: Selection Limit Per Machine Instead of Global
**Symptom:** Users could select 2 items per machine (e.g., 2 from Cincinnati + 2 from Hurco)

**Expected Behavior:** Maximum 2 selections total across ALL machines and dropdowns

**Solution:**
1. **Global Limit Check:** Unified selection validation
   ```javascript
   if (selectedGraphs.length >= 2 && !selectedGraphs.includes(id)) {
     // Block selection
     return;
   }
   ```

2. **Visual Feedback:** Disable unselected items when limit reached
   ```javascript
   className={`... ${
     selectedGraphs.length >= 2 && !selectedGraphs.includes(id) 
       ? 'opacity-50 cursor-not-allowed' 
       : 'cursor-pointer'
   }`}
   ```

3. **Click Prevention:** Only allow clicks if under limit or deselecting
   ```javascript
   onClick={() => {
     if (selectedGraphs.length < 2 || selectedGraphs.includes(id)) {
       handleGraphSelection(id, machineName);
     }
   }}
   ```

**Files Modified:**
- `ComponentBuilder.jsx`: Updated all data type selection sections (MACH, GENR, Dropdowns)

**Status:** ✅ Fixed

---

### Issue 4: Dropdowns Missing in MACH Dashboard
**Symptom:** Dropdown section only appeared in GENR mode, not in MACH mode

**Root Cause:** Dropdown fetching logic was inside GENR-specific `else` block

**Solution:**
1. Added dropdown fetching to MACH mode initialization
2. Moved `fetchDropdowns()` call to both MACH and GENR paths

**Files Modified:**
- `useComponentBuilderData.js`: Lines 40-50 (added dropdown fetch for MACH mode)
- `ComponentBuilder.jsx`: Dropdown section already used condition `{dropdowns && dropdowns.length > 0}` which works for both modes

**Status:** ✅ Fixed

---

### Issue 5: Inconsistent Accordion Behavior
**Symptom 1:** MACH accordion started expanded, GENR accordions started collapsed

**Solution 1:** Changed default state
```javascript
// Before
const [isAccordionOpen, setIsAccordionOpen] = useState(true);

// After
const [isAccordionOpen, setIsAccordionOpen] = useState(false);
```

**Symptom 2:** MACH accordion used different toggle pattern than GENR/Dropdowns
- MACH used: `isAccordionOpen` state + `setIsAccordionOpen()` setter
- GENR/Dropdowns used: `expandedMachines` array + `toggleMachine()` function

**Solution 2:** Unified MACH to use same pattern as GENR
```javascript
// Before (MACH only)
<button onClick={() => setIsAccordionOpen(!isAccordionOpen)}>
<div className={isAccordionOpen ? 'max-h-[1000px]' : 'max-h-0'}>

// After (MACH unified)
<button onClick={() => toggleMachine(machineName)}>
<div className={expandedMachines.includes(machineName) ? 'max-h-[1000px]' : 'max-h-0'}>
```

**Benefits:**
- Consistent behavior across all accordion types
- Unified state management
- Enables lazy loading for MACH mode
- Cleaner, more maintainable code

**Files Modified:**
- `ComponentBuilder.jsx`: Lines 215-243 (MACH accordion section)

**Status:** ✅ Fixed

---

### Issue 6: Wrong Machine Name in Dropdown Series
**Symptom:** When selecting from "DropdownA", the series section showed "Hurco" instead of "DropdownA", and data type title was missing

**Root Cause:** In dropdown section, `handleGraphSelection` was called with `machineName` variable from outer scope (URL parameter for MACH mode) instead of `dropdownName`

**Problematic Code:**
```javascript
// In dropdown section map
{dropdowns.map((dropdown) => {
  const dropdownName = dropdown;
  // ...
  onClick={() => {
    handleGraphSelection(datatypes.id, machineName); // ❌ Wrong!
  }}
})}
```

**Solution:**
```javascript
// Fixed version
{dropdowns.map((dropdown) => {
  const dropdownName = dropdown;
  // ...
  onClick={() => {
    handleGraphSelection(datatypes.id, dropdownName); // ✅ Correct!
  }}
})}
```

**Impact:**
- `graphToMachineMap` now correctly stores "DropdownA" instead of "Hurco"
- Purple badge in series section correctly shows dropdown name
- Config lookup finds correct data type from `machineDataTypes['DropdownA']`
- Blue badge correctly displays data type title (e.g., "Temperature")

**Files Modified:**
- `ComponentBuilder.jsx`: Line 450 (dropdown onClick handler)

**Status:** ✅ Fixed

---

## File Structure

### Modified Files
```
src/
├── hooks/
│   └── useComponentBuilderData.js          [MODIFIED - Added unique IDs, dropdowns, machine mapping]
│
├── pages/
│   ├── ComponentBuilder.jsx                [MODIFIED - Unified accordions, global limit, dropdowns]
│   └── DashboardSummary.jsx               [MODIFIED - Fixed const assignment error]
│
└── docs/
    └── STAGE2_IMPLEMENTATION.md           [NEW - This documentation]
```

### Key Code Locations

#### useComponentBuilderData.js
- **Lines 40-120:** Initial data fetching (MACH and GENR modes)
- **Lines 122-180:** `fetchDataTypesForMachine()` - Lazy loading with unique IDs
- **Lines 182-220:** `handleGraphSelection()` - Selection management with limit
- **Lines 222-260:** `fetchAvailableSeries()` - Series fetching with ID extraction
- **Lines 262-340:** `generateGraph()` - Graph generation with ID conversion

#### ComponentBuilder.jsx
- **Lines 27-34:** State management (accordions, selection)
- **Lines 91-99:** `toggleMachine()` - Unified accordion toggle
- **Lines 210-290:** MACH dashboard section
- **Lines 295-385:** GENR dashboard section
- **Lines 390-475:** Dropdown section
- **Lines 520-580:** Configure series section
- **Lines 605-655:** Graph display and save

---

## API Integration

### Endpoints Used

#### 1. GET `/api/data-types/`
**Purpose:** Fetch available data types for a machine or dropdown

**Query Parameters:**
- `machine_name`: Name of machine or dropdown

**Response:**
```json
[
  {
    "id": "1",
    "title": "Acceleration",
    "unit": "m/s²",
    "pivot": "Axis"
  },
  {
    "id": "2",
    "title": "Temperature",
    "unit": "°C",
    "pivot": null
  }
]
```

**Frontend Transformation:**
```javascript
// Add unique ID and keep original
{
  id: "Cincinnati_1",           // Unique frontend ID
  originalId: "1",              // Original backend ID
  title: "Acceleration",
  unit: "m/s²",
  pivot: "Axis"
}
```

---

#### 2. GET `/api/machines-with-config/`
**Purpose:** Fetch all machines that have both database entry and config file

**Response:**
```json
[
  {
    "vName": "Cincinnati",
    "vType": "CNC",
    "iMachine_id": 1
  },
  {
    "vName": "Hurco",
    "vType": "CNC",
    "iMachine_id": 2
  }
]
```

---

#### 3. GET `/api/dropdowns-from-config/`
**Purpose:** Fetch dropdown names from config files

**Response:**
```json
["DropdownA"]
```

**Usage:** Fetch data types for each dropdown via `/api/data-types/?machine_name=DropdownA`

---

#### 4. GET `/api/available-series/`
**Purpose:** Fetch available series (axes) for a specific data type

**Query Parameters:**
- `machine_name`: Name of machine/dropdown
- `graph_id`: Original data type ID (extracted from unique ID)

**Request Example:**
```
GET /api/available-series/?machine_name=Cincinnati&graph_id=1
```

**Response:**
```json
["X-Axis_Motor", "Y-Axis_Motor", "Z-Axis_Motor", "Spindle"]
```

---

#### 5. POST `/api/generate-data/`
**Purpose:** Generate graph/stat/info data from selections

**Request Body:**
```json
{
  "graphIds": [
    { "id": "1", "machine": "Cincinnati" },
    { "id": "2", "machine": "Hurco" }
  ],
  "seriesSelection": {
    "1": ["X-Axis_Motor", "Y-Axis_Motor"],
    "2": ["Spindle"]
  },
  "timeRange": {
    "value": 7,
    "unit": "days"
  },
  "selectedType": "Graph"
}
```

**Response:**
```json
{
  "chartData": [
    {
      "timestamp": "2024-12-01T00:00:00Z",
      "Cincinnati_X-Axis_Motor": 150,
      "Cincinnati_Y-Axis_Motor": 145,
      "Hurco_Spindle": 3500
    }
  ],
  "series": ["Cincinnati_X-Axis_Motor", "Cincinnati_Y-Axis_Motor", "Hurco_Spindle"],
  "unit": "Mixed",
  "axisConfig": {
    "left": { "unit": "m/s²", "series": ["Cincinnati_X-Axis_Motor", "Cincinnati_Y-Axis_Motor"] },
    "right": { "unit": "RPM", "series": ["Hurco_Spindle"] }
  }
}
```

---

## Testing Guide

### Test Scenario 1: MACH Dashboard - Single Machine Flow
**Objective:** Verify single machine accordion behavior with dropdown integration

**Steps:**
1. Navigate to Dashboard Summary with machine-specific dashboard
2. Click "Create New Entry" button
3. Verify URL: `/component-builder?dashboardId=X&machineName=Cincinnati`
4. Verify left panel displays:
   - Type dropdown (default: Graph)
   - Single machine accordion: "Cincinnati" (collapsed)
   - Selection counter: (0/2)
5. Click "Cincinnati" accordion → should expand
6. Verify data types loaded and displayed
7. Select first data type → verify:
   - Item gets blue border and checkmark
   - Counter updates to (1/2)
   - Configure Series section appears in center panel
   - Series are being fetched for selected data type
8. Select second data type → verify:
   - Item gets blue border and checkmark
   - Counter updates to (2/2)
   - All unselected items become semi-transparent (disabled)
   - Cannot select third data type
9. Scroll down to dropdown section
10. Expand "DropdownA" accordion
11. Verify dropdown data types displayed (Temperature, PM2.5, etc.)
12. Try to select dropdown item → should be blocked (already at 2/2 limit)
13. Deselect one machine data type → counter shows (1/2)
14. Select dropdown item → verify:
    - Item selected successfully
    - Counter shows (2/2)
    - Series section shows "DropdownA" badge (purple) + data type title (blue)

**Expected Results:**
- ✅ Single machine accordion with data types
- ✅ Dropdowns displayed and functional
- ✅ Global 2-item limit enforced across machine + dropdown
- ✅ Dropdown selections show correct name in series section
- ✅ Lazy loading works correctly

---

### Test Scenario 2: GENR Dashboard - Multiple Machines Flow
**Objective:** Verify multiple machine accordions with cross-machine selection

**Steps:**
1. Navigate to Dashboard Summary with generic dashboard
2. Click "Create New Entry" button
3. Verify URL: `/component-builder?dashboardId=X` (no machineName)
4. Verify left panel displays:
   - Type dropdown
   - Multiple machine accordions: Cincinnati, Hurco (all collapsed)
   - Dropdown accordions: DropdownA (collapsed)
   - Selection counter: (0/2)
5. Expand "Cincinnati" accordion → verify:
   - Loading spinner appears
   - Data types load and display
   - Accordion stays expanded
6. Select "Acceleration" from Cincinnati → verify:
   - Counter shows (1/2)
   - Series section shows purple "Cincinnati" badge + blue "Acceleration" badge
7. Expand "Hurco" accordion → verify data types load
8. Select "Acceleration" from Hurco → verify:
   - Counter shows (2/2)
   - Series section shows both:
     - Purple "Cincinnati" + Blue "Acceleration"
     - Purple "Hurco" + Blue "Acceleration"
   - Both are separate, independent selections
   - All unselected items disabled (opacity-50)
9. Try selecting from "DropdownA" → should be blocked (2/2 limit)
10. Deselect Cincinnati Acceleration → counter shows (1/2)
11. Expand "DropdownA" accordion
12. Select "Temperature" from DropdownA → verify:
    - Counter shows (2/2)
    - Series section shows:
      - Purple "Hurco" + Blue "Acceleration"
      - Purple "DropdownA" + Blue "Temperature" (not "Hurco" + "Temperature")

**Expected Results:**
- ✅ Multiple machine accordions
- ✅ Lazy loading per machine
- ✅ Independent selections from different machines (no ID collision)
- ✅ Global 2-item limit enforced across all machines
- ✅ Dropdown integration works correctly
- ✅ Correct machine names in series section

---

### Test Scenario 3: Series Configuration and Graph Generation
**Objective:** Verify series selection and graph generation flow

**Steps:**
1. Complete Test Scenario 1 or 2 to select 2 data types
2. Verify "Configure Series" accordion is visible (expanded by default)
3. For first data type, verify:
   - Machine name badge (purple) displayed
   - Data type title badge (blue) displayed
   - Series grid appears with buttons (e.g., X-Axis, Y-Axis, Z-Axis)
4. Click series buttons → verify:
   - Selected series turn blue background + white text
   - Can select multiple series
   - Can deselect by clicking again
5. Repeat for second data type
6. Click "Generate" button → verify:
   - Button shows "Generating..." with spinner
   - API call made to `/api/generate-data/`
   - Request includes original IDs (not unique IDs)
   - Request includes correct machine names
7. After generation completes, verify:
   - Graph appears in center panel below series section
   - Chart displays correctly with selected series
   - "Add to Dashboard" button appears below graph
8. Click graph → verify:
   - Modal opens with fullscreen zoomable version
   - All series visible
   - Can zoom and pan

**Expected Results:**
- ✅ Series configuration UI works correctly
- ✅ Multiple series selectable per data type
- ✅ Generate button triggers API call
- ✅ Original IDs sent to backend (not unique frontend IDs)
- ✅ Graph renders with correct data
- ✅ Zoomable modal functions

---

### Test Scenario 4: Accordion State and Lazy Loading
**Objective:** Verify accordion state persistence and lazy loading optimization

**Steps:**
1. Start with GENR dashboard (multiple machines)
2. Expand "Cincinnati" accordion
3. Wait for data types to load
4. Collapse "Cincinnati" accordion
5. Re-expand "Cincinnati" accordion → verify:
   - Data types appear immediately (no loading spinner)
   - No API call made (check Network tab)
   - Data cached from first load
6. Expand "Hurco" accordion → verify:
   - Loading spinner appears
   - API call made (first time expansion)
   - Data loads and displays
7. Select data type from Cincinnati
8. Select data type from Hurco
9. Verify both accordions remain expanded
10. Collapse both accordions
11. Verify selections persist (checkmarks still visible when re-expanded)
12. Expand dropdown accordion → verify lazy loading works same way

**Expected Results:**
- ✅ Accordions collapse/expand smoothly
- ✅ Data fetched only on first expansion (lazy loading)
- ✅ Subsequent expansions use cached data
- ✅ Selection state persists across collapse/expand
- ✅ Multiple accordions can be open simultaneously

---

### Test Scenario 5: Selection Limit Edge Cases
**Objective:** Verify global 2-item limit enforcement in various scenarios

**Steps:**
1. **Scenario A: Same data type from different machines**
   - Select "Acceleration" from Cincinnati
   - Select "Acceleration" from Hurco
   - Verify: Both selected independently (no collision)
   - Verify: Counter shows (2/2)
   - Try selecting third item → blocked

2. **Scenario B: Mix of machine and dropdown**
   - Select "Temperature" from Cincinnati
   - Select "PM2.5" from DropdownA
   - Verify: Counter shows (2/2)
   - Try selecting from any other source → blocked

3. **Scenario C: Deselection and reselection**
   - With 2 items selected (2/2)
   - Deselect one item → counter shows (1/2)
   - Verify: Previously disabled items now enabled
   - Select different item → counter shows (2/2)
   - Verify: Correct items disabled again

4. **Scenario D: Rapid clicks**
   - With 1 item selected (1/2)
   - Rapidly click 3 different items
   - Verify: Only 1 additional item selected (max 2 total)
   - Verify: No unexpected behavior

**Expected Results:**
- ✅ Global limit enforced across all sources
- ✅ Same-named items from different machines are independent
- ✅ Visual feedback (opacity, cursor) correct at all times
- ✅ No race conditions or unexpected selections

---

### Test Scenario 6: Dropdown Integration
**Objective:** Verify dropdown configuration integration in both modes

**Steps:**
1. **Test in MACH mode:**
   - Navigate to MACH dashboard (?machineName=Cincinnati)
   - Verify dropdown section appears
   - Expand "DropdownA"
   - Verify data types loaded from config
   - Select dropdown item
   - Verify works same as machine data types

2. **Test in GENR mode:**
   - Navigate to GENR dashboard (no machineName)
   - Verify dropdown section appears
   - Verify same functionality as MACH mode

3. **Test dropdown data type uniqueness:**
   - Select "Temperature" from DropdownA in GENR mode
   - Try selecting "Temperature" from Cincinnati machine
   - Verify: Both are separate selections (no collision)

**Expected Results:**
- ✅ Dropdowns appear in both MACH and GENR modes
- ✅ Dropdown data types have unique IDs
- ✅ Same functionality as machine data types
- ✅ Count toward global 2-item limit

---

## Summary of Changes

### Features Implemented
1. ✅ Unified accordion structure across MACH and GENR dashboards
2. ✅ Unique ID system with machine prefixing
3. ✅ Global 2-item selection limit enforcement
4. ✅ Lazy loading for data types (per-accordion)
5. ✅ Dropdown integration in both modes
6. ✅ Machine name tracking (`graphToMachineMap`)
7. ✅ Series configuration interface
8. ✅ Graph generation with ID conversion
9. ✅ Visual feedback (selection counter, disabled states)
10. ✅ Consistent accordion behavior (unified toggle pattern)

### Bugs Fixed
1. ✅ Assignment to constant variable error
2. ✅ ID collision between same data types from different machines
3. ✅ Selection limit per machine vs global
4. ✅ Missing dropdowns in MACH mode
5. ✅ Inconsistent accordion start state
6. ✅ Inconsistent accordion toggle patterns
7. ✅ Wrong machine name in dropdown series section

### Code Quality Improvements
1. ✅ Unified state management with `expandedMachines` array
2. ✅ Consistent `toggleMachine()` function usage
3. ✅ Clear separation of concerns (hook vs component)
4. ✅ Comprehensive error handling
5. ✅ Loading states for better UX
6. ✅ Clean, maintainable code structure

---

## Next Steps (Stage 3)

### Planned Features
1. **Save to Dashboard:** Complete "Add to Dashboard" functionality
2. **Edit Mode:** Allow editing existing dashboard entries
3. **Delete Functionality:** Remove dashboard entries
4. **Reordering:** Drag-and-drop entry reordering
5. **Dashboard Display:** Render saved entries on dashboard page
6. **Stats/Info Types:** Implement non-graph visualization types
7. **Time Range Selector:** Add time range configuration UI
8. **Export:** Export dashboard/graphs as PDF or image

### Technical Debt
1. Error boundary implementation
2. Unit tests for custom hook
3. Integration tests for ComponentBuilder
4. Performance optimization for large datasets
5. Accessibility improvements (keyboard navigation)
6. Mobile responsive design refinements

---

## Conclusion

Stage 2 successfully implements the core dashboard entry builder functionality with a focus on:
- **Consistency:** Unified UI/UX patterns across all dashboard types
- **Correctness:** Fixed critical bugs (ID collision, selection limits)
- **Usability:** Intuitive accordion interface with lazy loading
- **Flexibility:** Support for both machine-specific and generic dashboards
- **Extensibility:** Clean architecture ready for Stage 3 features

The implementation provides a solid foundation for users to create custom visualizations by selecting data types from multiple sources (machines and dropdowns), configuring their series, and generating graphs.

---

**Document Version:** 1.0  
**Last Updated:** December 4, 2025  
**Author:** Development Team  
**Status:** Complete ✅
