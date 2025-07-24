import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:8000/api';

const InfluxDBTest = () => {
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [dashboardStatus, setDashboardStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  // Test InfluxDB connection
  const testConnection = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/test-connection/`);
      const data = await response.json();
      setConnectionStatus(data);
    } catch (error) {
      setConnectionStatus({
        status: 'error',
        message: `Failed to connect to API: ${error.message}`
      });
    }
    setLoading(false);
  };

  // Test Dashboard API connection
  const testDashboardConnection = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard-config/`);
      const data = await response.json();
      setDashboardStatus(data);
    } catch (error) {
      setDashboardStatus({
        status: 'error',
        message: `Failed to connect to API: ${error.message}`
      });
    }
    setLoading(false);
  };

  // Test connection on component mount
  useEffect(() => {
    testConnection();
    testDashboardConnection();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '⏳';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
        InfluxDB API Test
      </h1>

      <div className="bg-gray-50 p-6 rounded-lg mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-700">Dashboard API Test</h2>
          <button
            onClick={testDashboardConnection}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Connection'}
          </button>
        </div>

        {dashboardStatus && (
          <div className={`p-4 rounded border-l-4 ${
            dashboardStatus.status === 'success' 
              ? 'bg-green-50 border-green-400' 
              : 'bg-red-50 border-red-400'
          }`}>
            <div className="flex items-center">
              <span className="text-xl mr-2">
                {getStatusIcon(dashboardStatus.status)}
              </span>
              <span className={`font-medium ${getStatusColor(dashboardStatus.status)}`}>
                {dashboardStatus.message}
              </span>
              <code className="ml-2 text-sm text-gray-500">
                {dashboardStatus.data ? JSON.stringify(dashboardStatus.data, null, 2) : 'No data available'}
              </code>
            </div>
          </div>
        )}
      </div>
      
      
    </div>
  );
};

export default InfluxDBTest;
