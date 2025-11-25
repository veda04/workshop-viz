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
    const url = `${API_BASE_URL}${API_ENDPOINTS.addNotes}`;
    return this.fetchWithErrorHandling(url, {
      method: 'POST',
      body: JSON.stringify(notesData),
    });
  }

  async getGraphConfigurations(machineName) {
    const url = buildUrl(API_ENDPOINTS.graphConfigurations, {
      machine_name: machineName,
    });
    return this.fetchWithErrorHandling(url);
  }

  async getCustomGraphData(requestData, machineName) {
    console.log('Request Data for Custom Graph:', requestData);
    const url = `${API_BASE_URL}${API_ENDPOINTS.customGraphData}`;
    return this.fetchWithErrorHandling(url, {
      method: 'POST',
      body: JSON.stringify({
        machine_name: machineName,
        ...requestData,
      }),
    });
  }

  async getAvailableSeries(graphId, machineName, range = '1h') {
    const url = buildUrl(API_ENDPOINTS.availableSeries, {
      machine_name: machineName,
      graph_id: graphId,
      range: range,
    });
    return this.fetchWithErrorHandling(url);
  }

  async saveCustomGraph(graphData) {
    const url = `${API_BASE_URL}${API_ENDPOINTS.saveCustomGraph}`;
    return this.fetchWithErrorHandling(url, {
      method: 'POST',
      body: JSON.stringify(graphData),
    });
  }

  async getCustomGraphs(machineName) {
    const url = buildUrl(API_ENDPOINTS.getCustomGraph, {
      machine_name: machineName,
    });
    return this.fetchWithErrorHandling(url);
  }

  async updateCustomGraph(graphId, graphData) {
    const url = `${API_BASE_URL}${API_ENDPOINTS.updateCustomGraph}${graphId}/`;
    return this.fetchWithErrorHandling(url, {
      method: 'PUT',
      body: JSON.stringify(graphData),
    });
  }

  async deleteCustomGraph(graphId) {
    const url = `${API_BASE_URL}${API_ENDPOINTS.deleteCustomGraph}${graphId}/`;
    return this.fetchWithErrorHandling(url, {
      method: 'DELETE',
    });
  }
}

export default new ApiService();