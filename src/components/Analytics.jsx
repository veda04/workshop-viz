import React from 'react';
import Header from './Header';
import Navigation from './Navigation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const Analytics = () => {
  const performanceData = [
    { name: 'Jan', efficiency: 85, downtime: 15 },
    { name: 'Feb', efficiency: 88, downtime: 12 },
    { name: 'Mar', efficiency: 92, downtime: 8 },
    { name: 'Apr', efficiency: 87, downtime: 13 },
    { name: 'May', efficiency: 94, downtime: 6 },
    { name: 'Jun', efficiency: 91, downtime: 9 },
  ];

  const usageData = [
    { name: 'Cutting', value: 45, color: '#0088FE' },
    { name: 'Drilling', value: 25, color: '#00C49F' },
    { name: 'Milling', value: 20, color: '#FFBB28' },
    { name: 'Idle', value: 10, color: '#FF8042' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      <Header />
      
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h2>
          <p className="text-gray-600">Performance metrics and usage analytics</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Performance Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Machine Efficiency Over Time</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Line type="monotone" dataKey="efficiency" stroke="#0088FE" strokeWidth={2} />
                  <Line type="monotone" dataKey="downtime" stroke="#FF8042" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Usage Distribution */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Machine Usage Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={usageData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {usageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">94%</div>
            <div className="text-gray-600">Overall Efficiency</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">1,247</div>
            <div className="text-gray-600">Parts Produced</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">6h</div>
            <div className="text-gray-600">Total Downtime</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">99.2%</div>
            <div className="text-gray-600">Quality Rate</div>
          </div>
        </div>
        
        <div className="bg-gray-400 text-center py-8 rounded-lg">
          <h2 className="text-2xl font-bold text-gray-800">ANALYTICS OVERVIEW</h2>
          <p className="text-gray-700 mt-2">Data processed from {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
