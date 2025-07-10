import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:8000/api';

const InfluxDBTest = () => {
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [machineData, setMachineData] = useState([]);
  const [testWriteStatus, setTestWriteStatus] = useState(null);

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

  // Write test data to InfluxDB
  const writeTestData = async () => {
    setLoading(true);
    const testData = {
      machine_id: 'MACHINE_001',
      temperature: 75.5 + Math.random() * 10,
      pressure: 50.0 + Math.random() * 5,
      vibration: 0.5 + Math.random() * 0.3
    };

    try {
      const response = await fetch(`${API_BASE_URL}/machine-data/write/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData)
      });
      const data = await response.json();
      setTestWriteStatus(data);
      
      if (data.status === 'success') {
        // Refresh machine data after successful write
        setTimeout(() => fetchMachineData(), 1000);
      }
    } catch (error) {
      setTestWriteStatus({
        status: 'error',
        message: `Failed to write data: ${error.message}`
      });
    }
    setLoading(false);
  };

  // Fetch machine data from InfluxDB
  const fetchMachineData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/machine-data/?limit=10`);
      const data = await response.json();
      if (data.status === 'success') {
        setMachineData(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch machine data:', error);
    }
  };

  // Test connection on component mount
  useEffect(() => {
    testConnection();
    fetchMachineData();
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

      {/* Data Display Section */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-700">Recent Machine Data</h2>
          <button
            onClick={fetchMachineData}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Refresh Data
          </button>
        </div>
        
        {machineData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-200">
                  <th className="px-4 py-2 text-left">Time</th>
                  <th className="px-4 py-2 text-left">Machine ID</th>
                  <th className="px-4 py-2 text-left">Field</th>
                  <th className="px-4 py-2 text-left">Value</th>
                </tr>
              </thead>
              <tbody>
                {machineData.slice(0, 10).map((record, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-2 text-sm">
                      {new Date(record.time).toLocaleString()}
                    </td>
                    <td className="px-4 py-2">{record.machine_id}</td>
                    <td className="px-4 py-2">{record.field}</td>
                    <td className="px-4 py-2">
                      {typeof record.value === 'number' 
                        ? record.value.toFixed(2) 
                        : record.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            No data available. Try writing some test data first.
          </div>
        )}
      </div>

      {/* API Endpoints Documentation */}
      <div className="mt-6 bg-blue-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">Available API Endpoints</h3>
        <div className="space-y-2 text-sm">
          <div><strong>GET</strong> <code>/api/health/</code> - Health check</div>
          <div><strong>GET</strong> <code>/api/test-connection/</code> - Test InfluxDB connection</div>
          <div><strong>GET</strong> <code>/api/machine-data/</code> - Get machine sensor data</div>
          <div><strong>POST</strong> <code>/api/machine-data/write/</code> - Write machine sensor data</div>
          <div><strong>GET</strong> <code>/api/machine-summary/</code> - Get machine summary data</div>
        </div>
      </div>
    </div>
  );
};

export default InfluxDBTest;
