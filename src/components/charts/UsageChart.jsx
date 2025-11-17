import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const UsageChart = ({title, onClick}) => {
  const usageData = [
    { name: 'Probing', value: 45, color: '#0088FE' },
    { name: 'Maching', value: 25, color: '#00C49F' },
    { name: 'Idle', value: 10, color: '#FF8042' },
  ];

  return (
    <div
        className={`
        bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700  
        ${onClick ? 'cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-600' : ''}
        backdrop-blur-sm bg-opacity-90 transition-colors
        `}
        onClick={onClick}
    >
        <h3 className="text-gray-700 dark:text-gray-300 text-lg font-semibold text-center mb-2 text-base leading-tight">
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