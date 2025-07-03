import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

const OverviewChart = ({ title, data, color = "#8884d8", yAxisDomain = [0, 100], onClick }) => {
  return (
    <div 
      className={`bg-gray-800 text-white p-4 rounded-lg h-64 ${onClick ? 'cursor-pointer hover:bg-gray-700 transition-colors' : ''}`}
      onClick={onClick}
    >
      <h3 className="text-lg font-semibold mb-4 text-center">{title}</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="time" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#9CA3AF' }}
            />
            <YAxis 
              domain={yAxisDomain}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#9CA3AF' }}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={color} 
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default OverviewChart;
