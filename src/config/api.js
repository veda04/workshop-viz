export const API_BASE_URL = 'http://10.101.23.23:9000'; //process.env.REACT_APP_API_URL || 'http://localhost:8000';

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
  saveCustomGraph: '/api/save-custom-graph/',
  getCustomGraph: '/api/get-custom-graphs/',
  configMachineList: '/api/config-machine-list/',    // for getting list of machines listed in config on home page
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