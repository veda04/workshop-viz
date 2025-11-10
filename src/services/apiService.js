import { API_BASE_URL, API_ENDPOINTS, buildUrl } from '../config/api';

class ApiService {
  async fetchWithErrorHandling(url, options = {}) {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      //  (Error fetching dashboard data: SyntaxError: Unexpected token 'N', ..."s_Motor": NaN, "C-Ax"... is not valid JSON)
      const text = await response.text();
      // Handle NaN values in JSON
      const sanitized = text.replace(/:\s*NaN\b/g, ': null');
      return JSON.parse(sanitized);
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async getDashboardConfig(machineName, rangeParams = '') {
    const url = buildUrl(API_ENDPOINTS.dashboardConfig, {
      machine_name: machineName,
    }) + rangeParams;
    return this.fetchWithErrorHandling(url);
  }

  async getCurrentBooking(machineName) {
    const url = buildUrl(API_ENDPOINTS.currentBooking, {
      machine_name: machineName,
    });
    return this.fetchWithErrorHandling(url);
  }

  async getUserList() {
    const url = `${API_BASE_URL}${API_ENDPOINTS.userList}`;
    return this.fetchWithErrorHandling(url);
  }

  async addNotes(notesData) {
    console.log('Adding notes:', notesData);
    const url = `${API_BASE_URL}${API_ENDPOINTS.addNotes}`;
    return this.fetchWithErrorHandling(url, {
      method: 'POST',
      body: JSON.stringify(notesData),
    });
  }
}

export default new ApiService();