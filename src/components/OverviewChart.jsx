import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

const OverviewChart = ({ title, data, series = [], color = ["#8884d8"], yAxisDomain = [0, 100], onClick }) => {
  // Ensure data is an array and not empty
  const chartData = Array.isArray(data) ? data : [];
  
  // Auto-detect series if not provided
  const actualSeries = series && series.length > 0 
    ? series 
    : Object.keys(chartData[0] || {}).filter(key => key !== 'time' && key !== 'ExecutionTime').slice(0, 5);
  
  return (
    <div 
      className={`
        bg-white rounded-xl shadow-lg border border-gray-200 p-0 h-72
        backdrop-blur-sm bg-opacity-90 overflow-hidden
        ${onClick && chartData.length > 0 ? 'cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300 hover:border-blue-300' : ''}
      `}
      onClick={chartData.length > 0 ? onClick : undefined}
    >
      <h3 className="z-50 text-lg w-full font-semibold my-2 tracking-wider text-sm text-center text-black">{title}</h3>
      <div className="h-56 bg-gray-800 p-2 relative">
        {chartData.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-gray-400 text-lg">No data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="time" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#9CA3AF' }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#9CA3AF' }}
              />
              {actualSeries.map((s, index) => (
                <Line
                  key={index}
                  type="monotone"
                  dataKey={s}
                  stroke={Array.isArray(color) ? color[index % color.length] : color}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={true}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
      
      {/* Mini Legend for the card view */}
      {actualSeries.length > 0 && chartData.length > 0 && (
        <div className="px-2 py-1">
          <div className="flex  gap-2 justify-center flex-wrap">
            {actualSeries.map((seriesName, index) => (
              <div key={index} className="flex items-center gap-1">
                <div 
                  className="w-2 h-2 rounded"
                  style={{ backgroundColor: Array.isArray(color) ? color[index % color.length] : color }}
                ></div>
                <p className="text-xs text-gray-600">
                  {seriesName}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OverviewChart;
