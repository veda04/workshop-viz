import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

const OverviewChart = ({ title, data, color = "#8884d8", yAxisDomain = [0, 100], onClick }) => {
  return (
    <div 
      className={`
        bg-white rounded-xl shadow-lg border border-gray-200 p-0 h-64
        backdrop-blur-sm bg-opacity-90
        ${onClick ? 'cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300 hover:border-blue-300' : ''}
      `}
      onClick={onClick}
    >
      <h3 className="absolute z-50 text-lg w-full font-semibold my-4 text-center text-white">{title}</h3>
      <div className="h-64 bg-gray-800 rounded-lg p-2">
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
