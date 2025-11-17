export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
  dashboardConfig: '/api/dashboard-config/',
  currentBooking: '/api/current-booking/',
  userList: '/api/user-list/',
  addNotes: '/api/add-notes/',
  testConnection: '/api/test-connection/',
  testMySQL: '/api/test-mysql/',
  graphConfigurations: '/api/graph-configurations/',
  customGraphData: '/api/custom-graph-data/',
  availableSeries: '/api/available-series/',
};

export const buildUrl = (endpoint, params = {}) => {
  const url = new URL(`${API_BASE_URL}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      url.searchParams.append(key, value);
    }
  });
  return url.toString();
};