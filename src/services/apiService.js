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
      
      const text = await response.text(); // (FIX FOR:- Error fetching dashboard data: SyntaxError: Unexpected token 'N', ..."s_Motor": NaN, "C-Ax"... is not valid JSON)
      const sanitized = text.replace(/:\s*NaN\b/g, ': null'); // Handle NaN values in JSON
      const data = JSON.parse(sanitized);

      if (!response.ok) {
        const errorMessage = data?.message || data?.error || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // ============================================================================
  // ATMAS DB related APIs
  // ============================================================================
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
    const url = `${API_BASE_URL}${API_ENDPOINTS.addNotes}`;
    return this.fetchWithErrorHandling(url, {
      method: 'POST',
      body: JSON.stringify(notesData),
    });
  }

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

  // ============================================================================
  // Influx DB related APIs
  // ============================================================================

  // async getDashboardConfig(machineName, rangeParams = '') {
  //   const url = buildUrl(API_ENDPOINTS.dashboardConfig, {
  //     machine_name: machineName,
  //   }) + rangeParams;
  //   return this.fetchWithErrorHandling(url);
  // }
  async getDataTypes(machineName) {
    const url = buildUrl(API_ENDPOINTS.dataTypes, {
      machine_name: machineName,
    });
    return this.fetchWithErrorHandling(url);
  }

  async getAvailableSeries(graphId, machineName, timeRange) {
    const url = buildUrl(API_ENDPOINTS.availableSeries, {
      graph_id: graphId,
      machine_name: machineName,
      time_range: timeRange,
    });
    return this.fetchWithErrorHandling(url);
  }

  async generateData(requestData, machineName) {
    const url = `${API_BASE_URL}${API_ENDPOINTS.generateData}`;
    return this.fetchWithErrorHandling(url, {
      method: 'POST',
      body: JSON.stringify({
        machine_name: machineName,
        ...requestData,
      }),
    });
  }
}
export default new ApiService();