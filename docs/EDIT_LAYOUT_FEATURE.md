# Edit Layout Feature - Complete Guide

## 📋 Overview

The Edit Layout feature allows users to customize their dashboard by rearranging and resizing blocks according to their preferences. The layout is automatically saved and persists across browser sessions using localStorage.

---

## 🎯 Key Features

### 1. Edit Layout Mode Toggle
- **Location**: Header, before the dark mode icon
- **Visual Indicator**: 
  - **Normal Mode**: Purple button with gear icon (⚙️) - "Edit Layout"
  - **Edit Mode**: Green button with check icon (✓) - "Save Layout"

### 2. Edit Mode Capabilities

#### **When Edit Mode is ACTIVE:**
- 🎨 **Visual Banner**: Purple banner appears with message "Edit Layout Mode Active - Drag and resize blocks to customize your dashboard"
- 🔄 **Reset Button**: Red "Reset Layout" button appears on the right side of banner
- 📦 **Drag & Drop**: Click and drag blocks anywhere on the dashboard
- 📏 **Resize**: Drag the purple corner handle (bottom-right) to resize blocks
- 🚫 **Disabled Features**:
  - Auto-reload (60-second refresh is paused)
  - Card/chart popups and modals (clicks do nothing)
  - Time range changes (dropdown is ignored)
  - Hover effects on block content
- 🎯 **Visual Feedback**:
  - Move cursor (✋) when hovering over blocks
  - Resize cursor (↘️) when hovering over corner handles
  - Purple dashed placeholder shows where block will be placed when dragging

#### **When Edit Mode is INACTIVE (Normal):**
- ✅ All standard functionality works normally
- ✅ Auto-reload every 60 seconds
- ✅ Clickable cards and charts open modals
- ✅ Time range selector updates data
- ✅ All hover effects active
- 🔒 Blocks are locked in place (no dragging/resizing)

---

## 🚀 How to Use

### **Customizing Your Dashboard**

1. **Enter Edit Mode**
   - Click the **purple gear icon** (⚙️) in the header
   - Purple banner appears confirming you're in edit mode

2. **Rearrange Blocks**
   - Click and hold any block
   - Drag it to your desired position
   - Release to drop it in place

3. **Resize Blocks**
   - Hover over the **bottom-right corner** of any block
   - You'll see a purple resize handle
   - Click and drag the handle to resize
   - Blocks snap to the 12-column grid system

4. **Save Your Layout**
   - Click the **green check icon** (✓) in the header
   - Layout is automatically saved to browser storage
   - Dashboard returns to normal operation

### **Resetting to Default Layout**

If you want to restore the original dashboard layout:

1. **Enter Edit Mode** (click purple gear icon)
2. **Click "Reset Layout"** button (red button on right side of banner)
3. Layout instantly resets to default
4. **Save** (click green check icon) to persist the reset

**Alternative Methods:**

- **Browser Console**: 
  ```javascript
  localStorage.removeItem('dashboardLayout'); location.reload();
  ```

- **Developer Tools**:
  - Press `F12` → Application tab → Local Storage
  - Delete the `dashboardLayout` key
  - Refresh the page

---

## 🏗️ Technical Architecture

### **Files Created/Modified**

1. **`src/context/EditLayoutContext.js`** (NEW)
   - React Context for managing edit mode state
   - Provides `isEditMode`, `toggleEditMode`, `enableEditMode`, `disableEditMode`

2. **`src/App.js`** (MODIFIED)
   - Wrapped with `EditLayoutProvider` to provide context to all components

3. **`src/components/layouts/Header.jsx`** (MODIFIED)
   - Added Edit Layout toggle button
   - Imported `useEditLayout` hook and Heroicons (`Cog6ToothIcon`, `CheckIcon`)

4. **`src/components/dashboard/MachineSummary.jsx`** (MODIFIED)
   - Integrated `react-grid-layout` with conditional behavior
   - Added layout state management with localStorage
   - Added `resetLayout()` function
   - Conditionally enabled dragging/resizing based on edit mode
   - Disabled click handlers in edit mode

5. **`src/components/dashboard/DashboardBlock.jsx`** (MODIFIED)
   - Added `isEditMode` prop
   - Conditionally disabled onClick handlers in edit mode

6. **`src/hooks/useDashboardData.js`** (MODIFIED)
   - Added `isEditMode` parameter
   - Disabled auto-refresh when in edit mode
   - Disabled range change events when in edit mode

7. **`src/App.css`** (MODIFIED)
   - Added comprehensive react-grid-layout styles
   - Purple theme for placeholders and handles
   - Disabled pointer events on content during edit mode
   - Enabled pointer events for resize handles

---

## 📐 Grid Layout System

### **Default Layout Structure**

The dashboard uses a **12-column grid system**:

| Block Type | Width | Height | Blocks per Row |
|------------|-------|--------|----------------|
| **Stat Cards** | 3 cols (25%) | 4 units | 4 |
| **Graph Blocks** | 4 cols (33.333%) | 8 units | 3 |
| **Other Blocks** | 4 cols (33.333%) | 6 units | 3 |

### **Grid Configuration**

```javascript
{
  cols: 12,              // 12 columns
  rowHeight: 25,         // 25px per row unit
  margin: [16, 16],      // 16px spacing between blocks
  containerPadding: [0, 0]
}
```

### **Layout Storage Format**

Layouts are saved to `localStorage` as JSON:
```json
[
  {
    "i": "0",      // Block index
    "x": 0,        // X position (0-11)
    "y": 0,        // Y position
    "w": 3,        // Width in columns
    "h": 4         // Height in row units
  },
  ...
]
```

---

## 🎨 Visual Design

### **Color Scheme**

- **Edit Mode Button**: Purple (`bg-purple-500`) → Green (`bg-green-500`)
- **Banner**: Purple background with border (`bg-purple-100`, `border-purple-500`)
- **Reset Button**: Red (`bg-red-500`)
- **Placeholder**: Purple with dashed border (30% opacity)
- **Resize Handle**: Purple borders

### **Dark Mode Support**

All components automatically adapt to dark mode:
- Banner: `dark:bg-purple-900`, `dark:border-purple-400`
- Reset Button: `dark:bg-red-600`
- Resize Handle: Light purple in dark mode

---

## 💾 Data Persistence

### **How It Works**

1. **On Initial Load**:
   - Check `localStorage` for saved layout
   - If found and valid, use saved layout
   - Otherwise, generate default layout

2. **During Edit Mode**:
   - Layout changes tracked in component state
   - No automatic saving (allows experimentation)

3. **On Save (Exit Edit Mode)**:
   - Current layout saved to `localStorage.dashboardLayout`
   - Edit mode disabled
   - Normal operations resume

4. **On Reset**:
   - `localStorage.dashboardLayout` cleared
   - Default layout regenerated immediately
   - User must save to persist the reset

### **Storage Key**

- **Key**: `dashboardLayout`
- **Scope**: Per browser/device
- **Persistence**: Survives page refreshes and browser restarts
- **Privacy**: Stored locally, never sent to server

---

## 🔧 Developer Notes

### **Adding Edit Mode Support to New Components**

```javascript
import { useEditLayout } from '../../context/EditLayoutContext';

const MyComponent = () => {
  const { isEditMode } = useEditLayout();
  
  return (
    <div onClick={isEditMode ? undefined : handleClick}>
      {/* Content */}
    </div>
  );
};
```

### **Disabling Features in Edit Mode**

```javascript
// Disable auto-refresh
useEffect(() => {
  if (!isEditMode) {
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }
}, [isEditMode]);
```

### **Grid Layout Props**

```javascript
<ReactGridLayout
  isDraggable={isEditMode}      // Enable drag in edit mode
  isResizable={isEditMode}      // Enable resize in edit mode
  compactType={null}            // Disable auto-compacting
  preventCollision={false}      // Allow overlapping during drag
  onLayoutChange={handleChange} // Track layout changes
/>
```

---

## 🐛 Troubleshooting

### **Issue: Layout doesn't save**
- **Cause**: Not exiting edit mode properly
- **Solution**: Always click the green check icon to save

### **Issue: Blocks snap to unexpected positions**
- **Cause**: Grid system enforces 12-column layout
- **Solution**: Blocks snap to nearest grid position (expected behavior)

### **Issue: Resize handle not visible**
- **Cause**: Not in edit mode, or CSS conflict
- **Solution**: Ensure edit mode is active, check browser console for errors

### **Issue: Different layouts on different devices**
- **Cause**: localStorage is per-browser/device
- **Expected**: Each device maintains its own layout
- **Solution**: This is by design for flexibility

### **Issue: Can't click cards in edit mode**
- **Expected**: Cards should NOT be clickable in edit mode
- **Solution**: Exit edit mode (click green check) to restore clickability

### **Issue: Auto-refresh not working**
- **Cause**: Still in edit mode
- **Solution**: Exit edit mode to re-enable auto-refresh

---

## 📊 Feature Comparison

| Feature | Normal Mode | Edit Mode |
|---------|-------------|-----------|
| Auto-refresh (60s) | ✅ Active | ❌ Disabled |
| Click cards/charts | ✅ Opens modals | ❌ No action |
| Hover effects | ✅ Active | ❌ Disabled |
| Time range selector | ✅ Updates data | ❌ Ignored |
| Drag blocks | ❌ Locked | ✅ Enabled |
| Resize blocks | ❌ Locked | ✅ Enabled |
| Layout save | ❌ N/A | ✅ On exit |

---

## 🎓 Best Practices

1. **Organize by Priority**: Place most important metrics at the top
2. **Group Related Data**: Keep similar metrics together
3. **Size by Importance**: Make critical data larger
4. **Save Frequently**: Exit and re-enter edit mode to save progress
5. **Test Different Layouts**: Use reset button to experiment without fear
6. **Consider Mobile**: While mobile isn't the focus, avoid overly complex layouts

---

## 🔐 Security & Privacy

- **No Server Communication**: Layouts stored entirely in browser
- **No Personal Data**: Only grid positions and sizes are saved
- **Per-User**: Each user's browser has its own layout
- **Easily Cleared**: Standard browser storage clearing removes layouts
- **No Tracking**: Feature doesn't track usage or send analytics

---

## 📝 Future Enhancements (Potential)

- [ ] Save multiple layout presets
- [ ] Export/import layouts
- [ ] Cloud sync across devices
- [ ] Layout templates
- [ ] Undo/redo functionality
- [ ] Lock individual blocks
- [ ] Mobile-specific layouts

---

## 📞 Support

For issues or questions about the Edit Layout feature:
1. Check this documentation
2. Review browser console for errors
3. Try resetting layout to defaults
4. Contact development team

---

**Last Updated**: November 27, 2025  
**Version**: 1.0.0  
**Feature Status**: ✅ Production Ready
