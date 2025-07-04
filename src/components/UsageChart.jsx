import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const UsageChart = ({title, onClick}) => {
  const usageData = [
    { name: 'Cutting', value: 45, color: '#0088FE' },
    { name: 'Drilling', value: 25, color: '#00C49F' },
    { name: 'Milling', value: 20, color: '#FFBB28' },
    { name: 'Idle', value: 10, color: '#FF8042' },
  ];

  return (
    <div
        className={`
        bg-white p-6 rounded-xl shadow-lg border border-gray-200  
        ${onClick ? 'cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300 hover:border-blue-300' : ''}
        backdrop-blur-sm bg-opacity-90
        `}
        onClick={onClick}
    >
        <h3 className="text-gray-700 text-lg font-semibold text-center mb-2 text-base leading-tight">
            {title}
        </h3>
        <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                data={usageData}
                cx="50%"
                cy="52%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={60}
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
  );
};

export default UsageChart;