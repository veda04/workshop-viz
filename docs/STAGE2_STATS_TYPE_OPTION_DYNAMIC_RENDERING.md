# STATS OPTION IN SELECT TYPE IMPLEMENTATION

**Date:** December 5, 2025  
**Feature:** Dynamic Graph/Stats Block Generation in Component Builder

---

## Overview

Implemented dynamic rendering of visualization components in the Component Builder based on user-selected type (Graph or Stats). Previously, the system only rendered `OverviewChart` components regardless of selection. Now it uses the reusable `DashboardBlock` component to render either graphs or statistics cards based on the "Select Type" dropdown.

---

## Changes Made

### 1. Backend Changes (`views.py`)

#### Modified `generate_data()` Function
- **Added Type to Response:** The backend now includes the `selected_type` in the API response, allowing the frontend to know what type of component to render.

```python
# Add selectedType to the response data
combined_data['type'] = selected_type
```

#### Stats Value Calculation
- **Special Handling for Stats Type:** When the selected type is 'stats', the backend calculates an aggregate value from the time series data.
- **Logic:** Extracts the latest non-null value for each series and returns it as `statsValue` in the response.

```python
# If type is 'stats', calculate aggregate values for stats display
if selected_type and selected_type.lower() == 'stats':
    # Calculate the latest value for each series
    stats_values = []
    for series_name in combined_data['series']:
        # Get the last non-null value for this series
        last_value = None
        for data_point in reversed(combined_data['chartData']):
            if data_point.get(series_name) is not None:
                last_value = data_point[series_name]
                break
        
        if last_value is not None:
            stats_values.append({
                'series': series_name,
                'value': last_value
            })
    
    # For stats, return first series value or calculate average
    if stats_values:
        combined_data['statsValue'] = stats_values[0]['value']
    else:
        combined_data['statsValue'] = 'N/A'
```

**How Stats are Generated:**
1. The backend receives the selected type ('stats' or 'graph') from the frontend
2. It processes all the time series data as usual (combining data from multiple machines/series)
3. When type is 'stats', it iterates through the `chartData` array in reverse order
4. For each series, it finds the **most recent non-null value**
5. It stores the first series' latest value as `statsValue` in the response
6. This value is then displayed in the `DataCard` component on the frontend

---

### 2. Frontend Changes

#### `DashboardBlock.jsx` Component

**Added New Props:**
- `selectedType`: Allows specifying the type externally (for custom graphs)
- `axisConfig`: Configuration for dual-axis charts
- `heightOuter` & `heightInner`: Configurable chart heights

**Enhanced Type Detection:**
```javascript
// Determine the type to render: use selectedType if provided, otherwise fall back to config.Type
const renderType = selectedType || config?.Type;
```

**Updated Stats Rendering:**
```javascript
if (renderType === 'Stat' || renderType === 'stats') {
    // For custom graphs (with selectedType), data is structured differently
    const statsValue = selectedType 
        ? (data?.[0]?.statsValue !== undefined ? data[0].statsValue : 'N/A')
        : (data?.[0]?.[0]?.value || 'N/A');
    
    return (
        <DataCard
            title={config?.Title}
            value={statsValue}
            textColor={config?.TextColor || getRandomColors(1)}
            unit={statsValue !== 'N/A' ? config?.Units || getUnitByTitle(config?.Title || '') : ''}
            onClick={config?.Maximisable ? () => handleCardClick({ config, data }, blockIndex) : undefined}
        />
    );
}
```

**Fixed Color Update Issue:**
- Added `useEffect` to update chart colors when `config.Color` changes
- This ensures colors generated in ComponentBuilder are properly propagated

```javascript
// Update chart colors when config.Color changes
useEffect(() => {
    if (config?.Color) {
        setChartColors(config.Color);
    }
}, [config?.Color]);
```

#### `ComponentBuilder.jsx` Component

**Added Imports:**
```javascript
import DashboardBlock from '../components/dashboard/DashboardBlock';
import { getFixedColors, getRandomColors } from '../utils/chartUtils';
import { getUnitByTitle } from '../utils/unitUtils';
```

**Replaced OverviewChart with DashboardBlock:**
```javascript
<DashboardBlock
    config={{
        Title: "",
        Series: graphData.series,
        Units: graphData.unit,
        YAxisDomain: [0, 'auto'],
        Color: chartColors
    }}
    initialData={graphData.type?.toLowerCase() === 'stats' ? [graphData] : [graphData.chartData]}
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
```

**Data Handling:**
- For **Graph type**: Passes `[graphData.chartData]` (array of chart data points)
- For **Stats type**: Passes `[graphData]` (full object containing `statsValue`)

---

## How It Works (Flow)

### Graph Type Flow:
1. User selects "Graph" from dropdown
2. User selects data types and series
3. Clicks "Generate" button
4. Backend processes request and returns chart data with `type: 'graph'`
5. Frontend generates colors based on number of series
6. `DashboardBlock` receives `selectedType='graph'`
7. Renders `<OverviewChart />` with time series data

### Stats Type Flow:
1. User selects "Stats" from dropdown
2. User selects data types and series
3. Clicks "Generate" button
4. Backend processes request, calculates latest value, returns data with `type: 'stats'` and `statsValue`
5. Frontend passes the entire graphData object (containing `statsValue`) to DashboardBlock
6. `DashboardBlock` receives `selectedType='stats'`
7. Extracts `statsValue` from data
8. Renders `<DataCard />` with the aggregated value

---

## Stats Calculation Logic Explained

### Backend Processing:
1. **Data Collection:** Backend queries InfluxDB for time series data as usual
2. **Type Check:** If `selected_type == 'stats'`, special processing begins
3. **Reverse Iteration:** Loops through `chartData` array from newest to oldest timestamp
4. **Value Extraction:** For each series, finds the first non-null value (most recent)
5. **Aggregation:** Currently uses the first series' latest value
6. **Response:** Adds `statsValue` field to the response data

### Frontend Display:
1. **Data Reception:** Receives `graphData` with `statsValue` field
2. **Type Detection:** `DashboardBlock` checks `selectedType === 'stats'`
3. **Value Access:** Extracts `data[0].statsValue`
4. **Rendering:** Displays value in `DataCard` with appropriate unit

### Example Data Structure:

**For Graph:**
```javascript
{
    chartData: [
        { time: "10:30", Spindle: 0.18, X_Axis: 0.010, ... },
        { time: "10:31", Spindle: 0.19, X_Axis: 0.011, ... }
    ],
    series: ["Spindle", "X_Axis", ...],
    type: "graph"
}
```

**For Stats:**
```javascript
{
    chartData: [...], // Still includes full time series data
    series: ["Spindle", "X_Axis", ...],
    type: "stats",
    statsValue: 0.18  // Latest value from first series
}
```

---

## Benefits

✅ **Single Reusable Component:** `DashboardBlock` works for both dashboard and custom graph contexts  
✅ **Type-Driven Rendering:** Automatically renders correct component based on user selection  
✅ **Backward Compatible:** Existing dashboard functionality remains unchanged  
✅ **Clean Architecture:** Separation of concerns between data fetching and rendering  
✅ **Extensible:** Easy to add new types (e.g., Usage, Pie Chart) in the future  
✅ **Consistent UX:** Same component behavior across different parts of the application  

---

## Files Modified

### Backend:
- `backend/workshopviz/views.py` - Added type to response and stats calculation logic

### Frontend:
- `src/components/dashboard/DashboardBlock.jsx` - Enhanced with dynamic type rendering
- `src/pages/ComponentBuilder.jsx` - Replaced OverviewChart with DashboardBlock
- No changes to utility files (already existed)

---

## Testing Recommendations

1. **Test Graph Type:**
   - Select "Graph" type
   - Choose 1-2 data types and their series
   - Verify chart renders with correct colors
   - Verify zoom modal works correctly

2. **Test Stats Type:**
   - Select "Stats" type
   - Choose data types and series
   - Verify numeric value displays correctly
   - Verify unit is shown properly
   - Check that value represents latest data point

3. **Test Edge Cases:**
   - No data available
   - Single series vs multiple series
   - Switching between Graph and Stats types
   - Different time ranges

---

## Future Enhancements

- **Multiple Aggregation Options:** Allow user to choose Min, Max, Average, or Latest for stats
- **Multiple Stats Cards:** Display a stat card for each selected series
- **Custom Formulas:** Allow users to define custom calculations for stats
- **Historical Comparison:** Show comparison with previous time period
- **Threshold Indicators:** Color-code stats based on threshold values

---

## Related Documentation

- [STAGE1_IMPLEMENTATION.md](./STAGE1_IMPLEMENTATION.md)
- [STAGE2_IMPLEMENTATION.md](./STAGE2_IMPLEMENTATION.md)
- [STAGE2_MULTI_CONFIG_SUPPORT.md](./STAGE2_MULTI_CONFIG_SUPPORT.md)
