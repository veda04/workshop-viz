import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:8000/api';

const InfluxDBTest = () => {
  const [connectionStatus, setConnectionStatus] = useState(null);
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

  // Test connection on component mount
  useEffect(() => {
    testConnection();
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
        InfluxDB API Test Dashboard
      </h1>

      {/* Connection Test Section */}
      <div className="bg-gray-50 p-6 rounded-lg mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-700">Connection Test</h2>
          <button
            onClick={testConnection}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Connection'}
          </button>
        </div>
        
        {connectionStatus && (
          <div className={`p-4 rounded border-l-4 ${
            connectionStatus.status === 'success' 
              ? 'bg-green-50 border-green-400' 
              : 'bg-red-50 border-red-400'
          }`}>
            <div className="flex items-center">
              <span className="text-xl mr-2">
                {getStatusIcon(connectionStatus.status)}
              </span>
              <span className={`font-medium ${getStatusColor(connectionStatus.status)}`}>
                {connectionStatus.message}
              </span>
            </div>
            {connectionStatus.buckets && connectionStatus.buckets.length > 0 && (
              <div className="mt-2">
                <strong>Available Buckets:</strong>
                <ul className="list-disc list-inside ml-4">
                  {connectionStatus.buckets.map((bucket, index) => (
                    <li key={index} className="text-gray-600">{bucket}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* API Endpoints Documentation */}
      <div className="mt-6 bg-blue-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">Available API Endpoints</h3>
        <div className="space-y-2 text-sm">
          <div><strong>GET</strong> <code>/api/health/</code> - Health check</div>
          <div><strong>GET</strong> <code>/api/test-connection/</code> - Test InfluxDB connection</div>
          <div><strong>GET</strong> <code>/api/dashboard-config/</code> - Get dashboard configuration</div>
          <div><strong>GET</strong> <code>/api/widget-config/&lt;widget_id&gt;/</code> - Get specific widget config</div>
        </div>
      </div>
    </div>
  );
};

export default InfluxDBTest;
