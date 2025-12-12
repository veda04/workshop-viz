# STAGE 1 - Dashboard Creation Flow Implementation

## Overview
This document details the implementation of the new dashboard creation flow for the Workshop Visualization project. The implementation allows users to create custom dashboards through a modal form and navigate to an empty dashboard ready for content creation.

---

## Table of Contents
1. [User Flow](#user-flow)
2. [Database Schema](#database-schema)
3. [Backend Implementation](#backend-implementation)
4. [Frontend Implementation](#frontend-implementation)
5. [API Endpoints](#api-endpoints)
6. [File Structure](#file-structure)
7. [Testing Guide](#testing-guide)

---

## User Flow

### Complete Flow Diagram
```
Home Page
   ↓
Select Dashboard (Dropdown with dummy data)
   OR
Click "Create New" Button
   ↓
Modal Opens → Create Dashboard Form
   ↓
User fills form:
   - Dashboard Type: [Machine Specific | Generic Dashboard]
   - Dashboard Title: (text input)
   - Machine: (dropdown - only if Machine Specific)
   - Created By: (dropdown - list of users)
   ↓
Click "Create" Button
   ↓
API Call: POST /api/create-dashboard/
   - Validates all fields
   - Creates entry in visualisation_dashboards table
   - Returns dashboard ID
   ↓
Navigate to: /dashboard-summary?dashboardId={id}
   ↓
Dashboard Summary Page (Empty State)
   - Shows "No Dashboard Entries Yet" message
   - Displays "Create New Entry" button
   - Hides booking/notes/refresh/air flow buttons
```

---

## Database Schema

### Table: `visualisation_dashboards`
Stores dashboard configurations created by users.

```sql
CREATE TABLE `visualisation_dashboards` (
  `iDashboard_id` BIGINT(20) NOT NULL AUTO_INCREMENT,
  `vTitle` VARCHAR(255) NOT NULL,
  `iAsset_id` BIGINT(20) DEFAULT NULL COMMENT 'Foreign key to assets table (NULL for generic dashboards)',
  `iUser_id` BIGINT(20) NOT NULL COMMENT 'Foreign key to users table',
  `dtCreated` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `dtModified` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `cCategory` CHAR(4) NULL DEFAULT 'MACH' COMMENT 'MACH = Machine Specific, GENR = Generic Dashboard',
  PRIMARY KEY (`iDashboard_id`),
  FOREIGN KEY (`iAsset_id`) REFERENCES `assets`(`iAsset_id`),
  FOREIGN KEY (`iUser_id`) REFERENCES `users`(`iUser_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### Related Tables

#### `assets`
```sql
TABLE `assets` (
  `iAsset_id` BIGINT(20) NOT NULL,
  `cCode` CHAR(5) DEFAULT NULL,
  `vName` VARCHAR(255) NOT NULL,
  `vDescription` VARCHAR(255) DEFAULT NULL,
  `vInstructions` TEXT DEFAULT NULL,
  `vManual` VARCHAR(255) DEFAULT NULL,
  `iLoc_id` BIGINT(20) NOT NULL,
  `cReturn_auth` CHAR(5) DEFAULT 'N',
  `cOnsite_auth` CHAR(5) DEFAULT NULL,
  `vOnsite_group` VARCHAR(255) DEFAULT NULL,
  `cOffsite_auth` CHAR(5) DEFAULT NULL,
  `vOffsite_group` VARCHAR(255) DEFAULT NULL,
  `iQty` BIGINT(20) DEFAULT 1,
  `iAvlQty` INT(11) DEFAULT 1,
  `cBookable` CHAR(5) DEFAULT 'Y',
  `vDataTypes` TEXT DEFAULT NULL,
  `cStatus` CHAR(5) DEFAULT 'I'
)
```

#### `asset_type`
```sql
CREATE TABLE `asset_type` (
  `iAst_type_id` BIGINT(20) NOT NULL,
  `vName` VARCHAR(255) NOT NULL,
  `vDesc` VARCHAR(255) DEFAULT NULL,
  `cStatus` CHAR(5) DEFAULT 'I'
)
```

#### `asset_type_assoc`
```sql
CREATE TABLE `asset_type_assoc` (
  `iAssoc_id` BIGINT(20) NOT NULL,
  `iAsset_type_id` BIGINT(20) NOT NULL,
  `iAsset_id` BIGINT(20) NOT NULL
)
```

#### `users`
```sql
CREATE TABLE `users` (
  `iUser_id` BIGINT(20) NOT NULL,
  `vName` VARCHAR(255) NOT NULL,
  -- additional fields...
)
```

---

## Backend Implementation

### 1. MySQL Service Functions
**File:** `backend/workshopviz/mysql_service.py`

#### `get_machine_assets()`
Retrieves all assets of type "Machine" from the database.

```python
def get_machine_assets(self):
    """Get all machine assets from the database that have asset type 'Machine'"""
    query = """
        SELECT DISTINCT a.iAsset_id, a.vName
        FROM assets a
        INNER JOIN asset_type_assoc asta ON a.iAsset_id = asta.iAsset_id
        INNER JOIN asset_type ast ON asta.iAsset_type_id = ast.iAst_type_id
        WHERE ast.vName = 'Machine' AND a.cStatus = 'A'
        ORDER BY a.vName
    """
```

**Returns:** List of dictionaries with `iAsset_id` and `vName`

#### `create_dashboard(title, asset_id, user_id, category)`
Creates a new dashboard entry in the database.

```python
def create_dashboard(self, title, asset_id, user_id, category):
    """Create a new dashboard entry in visualisation_dashboards table"""
    query = """
        INSERT INTO visualisation_dashboards 
        (vTitle, iAsset_id, iUser_id, cCategory) 
        VALUES (%s, %s, %s, %s)
    """
```

**Parameters:**
- `title` (str): Dashboard title
- `asset_id` (int|None): Asset ID (NULL for generic dashboards)
- `user_id` (int): User ID of creator
- `category` (str): 'MACH' or 'GENR'

**Returns:** Dashboard ID of newly created record

---

### 2. API Endpoints
**File:** `backend/workshopviz/views.py`

#### GET `/api/machines-with-config/`
Returns machines that have JSON config files in the `backend/config/` folder.

**Logic:**
1. Query database for all machines (type = 'Machine')
2. Get all JSON config files (excluding files with '-')
3. Merge results: Include machines from config (in DB as well as config, both conditions should be satisfied)

**Response:**
```json
{
  "status": "success",
  "message": "Machines with config retrieved successfully",
  "data": [
    {
      "iAsset_id": 123,
      "vName": "Hurco",
      "hasConfig": true,
      "inDatabase": true
    },
    {
      "iAsset_id": null,
      "vName": "Cincinnati",
      "hasConfig": true,
      "inDatabase": false
    }
  ]
}
```

#### POST `/api/create-dashboard/`
Creates a new dashboard in the database.

**Request Body:**
```json
{
  "title": "My Custom Dashboard",
  "dashboardType": "machine",
  "machineName": "Hurco",
  "userId": 5
}
```

**Validation:**
- `title`: Required, non-empty string
- `userId`: Required
- `machineName`: Required if `dashboardType` == 'machine'

**Response (Success):**
```json
{
  "status": "success",
  "message": "Dashboard created successfully",
  "data": {
    "dashboardId": 42,
    "title": "My Custom Dashboard",
    "machineName": "Hurco",
    "category": "MACH"
  }
}
```

**Response (Error):**
```json
{
  "status": "error",
  "message": "Dashboard title is required",
  "data": {}
}
```

#### GET `/api/user-list/`
Returns list of users (already exists, reused from notes module).

**Response:**
```json
{
  "status": "success",
  "message": "User list retrieved successfully",
  "data": [
    {
      "iUser_id": 3,
      "vName": "John Doe"
    },
    {
      "iUser_id": 4,
      "vName": "Jane Smith"
    }
  ]
}
```

---

## Frontend Implementation

### 1. Page Structure

#### `src/pages/home.jsx`
- Displays dashboard selection dropdown (dummy data for now)
- "Create New" button opens modal
- Uses `Modal` component with `CreateDashboardForm`

#### `src/pages/DashboardSummary.jsx` (renamed from MachineSummary)
- Reads `dashboardId` from URL query params
- Shows empty state for new dashboards
- Displays "Create New Entry" button (popup functionality to be implemented later)
- Hides booking/notes/refresh buttons for new dashboards

#### `src/pages/CustomDashboard.jsx` (renamed from CustomGraphs)
- Dashboard builder/editor (to be used in popup later)

---

### 2. Create Dashboard Form
**File:** `src/components/forms/CreateDashboardForm.jsx`

#### Features:
- **Dashboard Type Selection:** Radio-style buttons (Machine Specific / Generic)
- **Title Input:** Required text field
- **Machine Dropdown:** Conditional (only for Machine Specific)
  - Fetches from `/api/machines-with-config/`
  - Shows machine name, stores machine ID
- **Created By Dropdown:** Required
  - Fetches from `/api/user-list/`
  - Shows user name, stores user ID
- **Form Validation:** Client-side validation before submission
- **API Integration:** Calls `/api/create-dashboard/` on submit
- **Navigation:** Redirects to `/dashboard-summary?dashboardId={id}` on success

#### State Management:
```javascript
const [dashboardType, setDashboardType] = useState('machine');
const [title, setTitle] = useState('');
const [selectedMachine, setSelectedMachine] = useState('');
const [selectedMachineId, setSelectedMachineId] = useState('');
const [selectedUserId, setSelectedUserId] = useState('');
const [machines, setMachines] = useState([]);
const [users, setUsers] = useState([]);
const [loadingMachines, setLoadingMachines] = useState(false);
const [loadingUsers, setLoadingUsers] = useState(false);
const [errors, setErrors] = useState({});
```

---

### 3. API Service
**File:** `src/services/apiService.js`

#### New Methods:

```javascript
async getMachinesWithConfig() {
  const url = `${API_BASE_URL}${API_ENDPOINTS.machinesWithConfig}`;
  return this.fetchWithErrorHandling(url);
}

async createDashboard(dashboardData) {
  const url = `${API_BASE_URL}${API_ENDPOINTS.createDashboard}`;
  return this.fetchWithErrorHandling(url, {
    method: 'POST',
    body: JSON.stringify(dashboardData),
  });
}
```

---

### 4. API Configuration
**File:** `src/config/api.js`

```javascript
export const API_ENDPOINTS = {
  currentBooking: '/api/current-booking/',
  userList: '/api/user-list/',
  addNotes: '/api/add-notes/',
  machinesWithConfig: '/api/machines-with-config/',  // NEW
  createDashboard: '/api/create-dashboard/',         // NEW
};
```

---

### 5. Routing
**File:** `src/App.js`

```javascript
<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/home" element={<Home />} />
  <Route path="/dashboard-summary" element={<DashboardSummary />} />
  <Route path="/custom-dashboard" element={<CustomDashboard />} />
</Routes>
```

---

## API Endpoints

### Summary Table

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/machines-with-config/` | Get machines with JSON configs | No |
| POST | `/api/create-dashboard/` | Create new dashboard | No |
| GET | `/api/user-list/` | Get list of users | No |
| GET | `/api/current-booking/` | Get current booking info | No |

---

## File Structure

```
workshop-viz/
├── backend/
│   ├── config/                      # Machine JSON config files
│   │   ├── Hurco.json
│   │   ├── Cincinnati.json
│   │   └── ...
│   ├── workshopviz/
│   │   ├── mysql_service.py        # ✅ Updated - Added get_machine_assets(), create_dashboard()
│   │   ├── views.py                # ✅ Updated - Added get_machines_with_config(), create_dashboard()
│   │   └── urls.py                 # ✅ Updated - Added new routes
│   └── requirements.txt
├── src/
│   ├── pages/
│   │   ├── home.jsx                # ✅ Updated - Modal integration
│   │   ├── DashboardSummary.jsx    # ✅ Updated - Empty state handling
│   │   └── CustomDashboard.jsx     # (Renamed from CustomGraphs)
│   ├── components/
│   │   ├── forms/
│   │   │   └── CreateDashboardForm.jsx  # ✅ NEW - Complete form with API integration
│   │   └── Modal.jsx               # ✅ Existing - Reused
│   ├── services/
│   │   └── apiService.js           # ✅ Updated - Added new methods
│   ├── config/
│   │   └── api.js                  # ✅ Updated - Added new endpoints
│   └── App.js                      # ✅ Updated - Routes configured
└── docs/
    └── STAGE1_IMPLEMENTATION.md    # ✅ This document
```

---

## Testing Guide

### 1. Backend Testing

#### Test MySQL Functions
```bash
# Start Django server
cd backend
python manage.py runserver

# Test in Python shell
python manage.py shell

from workshopviz.mysql_service import MySQLService
service = MySQLService()

# Test get_machine_assets()
machines = service.get_machine_assets()
print(machines)

# Test create_dashboard()
dashboard_id = service.create_dashboard(
    title="Test Dashboard",
    asset_id=1,
    user_id=3,
    category="MACH"
)
print(f"Created dashboard ID: {dashboard_id}")
```

#### Test API Endpoints
```bash
# Test GET /api/machines-with-config/
curl http://localhost:8000/api/machines-with-config/

# Test POST /api/create-dashboard/
curl -X POST http://localhost:8000/api/create-dashboard/ \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Test Dashboard",
    "dashboardType": "machine",
    "machineName": "Hurco",
    "userId": 3
  }'

# Test GET /api/user-list/
curl http://localhost:8000/api/user-list/
```

---

### 2. Frontend Testing

#### Start Development Server
```bash
npm start
# App runs on http://localhost:3000
```

#### Test Flow
1. **Home Page**
   - ✅ Verify dropdown shows dummy dashboards
   - ✅ Click "Create New" → Modal opens

2. **Create Dashboard Form**
   - ✅ Toggle between "Machine Specific" and "Generic Dashboard"
   - ✅ Verify machine dropdown only shows for "Machine Specific"
   - ✅ Verify machines dropdown populates from API
   - ✅ Verify users dropdown populates from API
   - ✅ Test validation: Try submitting empty form
   - ✅ Fill all fields and submit

3. **Navigation**
   - ✅ After submit, verify redirect to `/dashboard-summary?dashboardId={id}`
   - ✅ Verify empty state shows with "No Dashboard Entries Yet"
   - ✅ Verify "Create New Entry" button appears

4. **Error Handling**
   - ✅ Test with network disconnected
   - ✅ Test with invalid user ID
   - ✅ Test with non-existent machine name

---

### 3. Database Verification

```sql
-- Check if dashboard was created
SELECT * FROM visualisation_dashboards 
ORDER BY dtCreated DESC 
LIMIT 10;

-- Verify foreign key relationships
SELECT 
    vd.iDashboard_id,
    vd.vTitle,
    a.vName AS machine_name,
    u.vName AS created_by,
    vd.cCategory,
    vd.dtCreated
FROM visualisation_dashboards vd
LEFT JOIN assets a ON vd.iAsset_id = a.iAsset_id
LEFT JOIN users u ON vd.iUser_id = u.iUser_id
ORDER BY vd.dtCreated DESC;
```

---

## Known Limitations & Future Work

### Current Limitations:
1. Home page dropdown uses dummy data (not fetching from DB)
2. "Create New Entry" button is non-functional (opens alert, not popup)
3. Dashboard Summary doesn't fetch dashboard title/details from DB yet
4. No dashboard edit/delete functionality yet

### Planned for Stage 2:
1. Implement "Create New Entry" popup with Dashboard Builder
2. API to save graph/block configurations
3. API to fetch dashboard by ID with all blocks
4. Dashboard listing API for home page dropdown
5. Edit/delete dashboard functionality
6. Dashboard sharing/permissions

---

## Troubleshooting

### Common Issues:

#### 1. "Machine not found in database"
- **Cause:** Selected machine doesn't have an entry in `assets` table
- **Solution:** Ensure machine exists in DB OR modify logic to accept config-only machines

#### 2. Empty machines dropdown
- **Cause:** No config files in `backend/config/` or database connection failed
- **Solution:** Check `MACHINE_CONFIG_PATH` setting and verify DB connection

#### 3. "User ID is required"
- **Cause:** No user selected in dropdown
- **Solution:** Verify `/api/user-list/` returns users with `iUser_id > 2`

#### 4. Navigation doesn't work after submit
- **Cause:** API returned error but frontend didn't catch it
- **Solution:** Check browser console for errors, verify API response format

---

## Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2025-12-02 | 1.0 | Initial implementation of Stage 1 |

---

## Contributors
- Backend: Django + MySQL integration
- Frontend: React + React Router
- Database: ATMAS MySQL database

---

## References
- Django REST Framework: https://www.django-rest-framework.org/
- React Router: https://reactrouter.com/
- MySQL Documentation: https://dev.mysql.com/doc/

---

**End of Stage 1 Documentation**
