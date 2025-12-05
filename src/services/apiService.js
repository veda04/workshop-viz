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

  async getDropdownsFromConfig() {
    const url = `${API_BASE_URL}${API_ENDPOINTS.dropdownsFromConfig}`;
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

  // Dashboard methods
  async getDashboards() {
    const url = `${API_BASE_URL}/dashboards/`;
    return this.fetchWithErrorHandling(url);
  }

  // ============================================================================
  // COMPONENT CRUD APIs
  // ============================================================================

  /**
   * Create a new component
   * @param {Object} componentData - Component data including iDashboard_id, vTitle, vDescription, iPosition, vQuery
   * @returns {Promise} Response with component_id
   */
  async createComponent(componentData) {
    const url = `${API_BASE_URL}/api/components/create/`;
    return this.fetchWithErrorHandling(url, {
      method: 'POST',
      body: JSON.stringify(componentData),
    });
  }

  /**
   * Get all components for a dashboard
   * @param {number} dashboardId - Dashboard ID
   * @returns {Promise} Response with array of components
   */
  async getComponents(dashboardId) {
    const url = `${API_BASE_URL}/api/components/?dashboard_id=${dashboardId}`;
    return this.fetchWithErrorHandling(url, {
      method: 'GET',
    });
  }

  /**
   * Get a single component by ID
   * @param {number} componentId - Component ID
   * @returns {Promise} Response with component data
   */
  async getComponent(componentId) {
    const url = `${API_BASE_URL}/api/components/${componentId}/`;
    return this.fetchWithErrorHandling(url, {
      method: 'GET',
    });
  }

  /**
   * Update an existing component
   * @param {number} componentId - Component ID
   * @param {Object} componentData - Updated component data
   * @returns {Promise} Response with success message
   */
  async updateComponent(componentId, componentData) {
    const url = `${API_BASE_URL}/api/components/${componentId}/update/`;
    return this.fetchWithErrorHandling(url, {
      method: 'PUT',
      body: JSON.stringify(componentData),
    });
  }

  /**
   * Delete a component
   * @param {number} componentId - Component ID
   * @returns {Promise} Response with success message
   */
  async deleteComponent(componentId) {
    const url = `${API_BASE_URL}/api/components/${componentId}/delete/`;
    return this.fetchWithErrorHandling(url, {
      method: 'DELETE',
    });
  }
}
export default new ApiService();