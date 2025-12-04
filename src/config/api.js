export const API_BASE_URL = 'http://10.101.23.23:9000'; // for production server

export const API_ENDPOINTS = {
  // dashboardConfig: '/api/dashboard-config/',
  testConnection: '/api/test-connection/',
  testMySQL: '/api/test-mysql/',

  currentBooking: '/api/current-booking/',
  userList: '/api/user-list/',
  addNotes: '/api/add-notes/',

  machinesWithConfig: '/api/machines-with-config/',
  dropdownsFromConfig: '/api/dropdowns-from-config/',
  createDashboard: '/api/create-dashboard/',

  dataTypes: '/api/data-types/',
  availableSeries: '/api/available-series/',
  generateData: '/api/generate-data/',

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