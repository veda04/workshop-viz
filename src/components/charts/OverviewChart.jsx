import React, { useState, useRef, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { generateTicks } from '../../utils/timeUtils';

const OverviewChart = ({ title, data, series = [], color = ["#8884d8"], yAxisDomain = [0, 100], unit = "", onClick, axisConfig }) => {
  // Ensure data is an array and not empty
  const chartData = Array.isArray(data) ? data : [];
  
  // Auto-detect series if not provided
  const actualSeries = series && series.length > 0 
    ? series 
    : Object.keys(chartData[0] || {}).filter(key => key !== 'time' && key !== 'ExecutionTime').slice(0, 5);

  // Determine if we have dual axes
  const hasDualAxes = axisConfig && axisConfig.length === 2;
  
  // Map series to their axis positions
  const seriesAxisMap = {};
  if (hasDualAxes) {
    axisConfig.forEach(config => {
      config.series.forEach(s => {
        seriesAxisMap[s] = config.position;
      });
    });
  }

  // Zoom and pan state
  const [zoomState, setZoomState] = useState({ startIndex: 0, endIndex: chartData.length - 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const [hasDragged, setHasDragged] = useState(false);
  const chartRef = useRef(null);

  // Reset zoom when data changes
  useEffect(() => {
    setZoomState({ startIndex: 0, endIndex: chartData.length - 1 });
  }, [chartData.length]);

  // Add wheel event listener with passive: false
  useEffect(() => {
    const chartElement = chartRef.current;
    if (!chartElement) return;

    const handleWheelEvent = (e) => {
      if (chartData.length === 0) return;
      e.preventDefault();
      e.stopPropagation();
      
      const delta = e.deltaY;
      const zoomFactor = 0.1;
      const range = zoomState.endIndex - zoomState.startIndex;
      const zoomAmount = Math.max(1, Math.floor(range * zoomFactor));
      
      if (delta < 0) {
        // Zoom in
        const newStart = Math.min(zoomState.startIndex + zoomAmount, zoomState.endIndex - 10);
        const newEnd = Math.max(zoomState.endIndex - zoomAmount, zoomState.startIndex + 10);
        setZoomState({ startIndex: newStart, endIndex: newEnd });
      } else {
        // Zoom out
        const newStart = Math.max(0, zoomState.startIndex - zoomAmount);
        const newEnd = Math.min(chartData.length - 1, zoomState.endIndex + zoomAmount);
        setZoomState({ startIndex: newStart, endIndex: newEnd });
      }
    };

    chartElement.addEventListener('wheel', handleWheelEvent, { passive: false });
    return () => {
      chartElement.removeEventListener('wheel', handleWheelEvent);
    };
  }, [chartData.length, zoomState]);

  // Handle drag pan
  const handleMouseDown = (e) => {
    if (e.button === 0) { // Left mouse button
      e.stopPropagation();
      setIsDragging(true);
      setHasDragged(false);
      setDragStart(e.clientX);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging || chartData.length === 0) return;
    
    const diff = dragStart - e.clientX;
    const range = zoomState.endIndex - zoomState.startIndex;
    const panAmount = Math.floor((diff / 500) * range); // Adjust sensitivity
    
    if (Math.abs(panAmount) > 0) {
      setHasDragged(true);
      const newStart = Math.max(0, Math.min(chartData.length - range - 1, zoomState.startIndex + panAmount));
      const newEnd = newStart + range;
      
      setZoomState({ startIndex: newStart, endIndex: Math.min(chartData.length - 1, newEnd) });
      setDragStart(e.clientX);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // Handle click with drag detection
  const handleChartClick = (e) => {
    if (hasDragged || isDragging) {
      e.stopPropagation();
      return;
    }
    if (onClick && chartData.length > 0) {
      onClick(e);
    }
  };

  // Reset zoom function
  const handleResetZoom = (e) => {
    e.stopPropagation();
    setZoomState({ startIndex: 0, endIndex: chartData.length - 1 });
  };

  // Check if zoomed
  const isZoomed = zoomState.startIndex !== 0 || zoomState.endIndex !== chartData.length - 1;

  // Get zoomed data
  const displayData = chartData.slice(zoomState.startIndex, zoomState.endIndex + 1);

  const customTicks = generateTicks(displayData);

  return (
    <div 
      className={`
        bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 p-0 h-72
        backdrop-blur-sm bg-opacity-90 overflow-hidden relative transition-colors
        ${onClick && chartData.length > 0 ? 'hover:shadow-xl hover:scale-105 transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-600' : ''}
      `}
      onClick={handleChartClick}
    >
      <h3 className="z-50 text-lg w-full font-semibold my-2 tracking-wider text-sm text-center text-black dark:text-white">{title}</h3>
      
      {/* Reset zoom button */}
      {isZoomed && chartData.length > 0 && (
        <button
          onClick={handleResetZoom}
          className="absolute top-12 right-2 z-50 bg-blue-500 hover:bg-blue-600 text-white text-xs px-2 py-1 rounded shadow-lg transition-colors"
          title="Reset Zoom"
        >
          Reset
        </button>
      )}

      {/* Help indicator */}
      {!isZoomed && chartData.length > 0 && (
        <div className="absolute top-12 right-2 z-40 bg-gray-700 bg-opacity-75 text-white text-xs px-2 py-1 rounded" title="Scroll to zoom, drag to pan">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
      )}

      <div 
        ref={chartRef}
        className={`h-56 bg-gray-800 dark:bg-gray-900 p-2 relative transition-colors`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {chartData.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center cursor-not-allowed">
            <p className="text-gray-400 dark:text-gray-500 text-lg">No data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%" className={`chart-interactive ${isDragging ? 'dragging' : ''}`}>
            <LineChart data={displayData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="time" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#9CA3AF' }}
                ticks={customTicks}
                interval={0}
                angle={-60}
              />
              
              {/* Dual Y-axes support */}
              {hasDualAxes ? (
                <>
                  <YAxis 
                    yAxisId="left"
                    orientation="left"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#9CA3AF' }}
                    tickFormatter={(value) => `${value} ${axisConfig[0].unit}`}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#9CA3AF' }}
                    tickFormatter={(value) => `${value} ${axisConfig[1].unit}`}
                  />
                </>
              ) : (
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#9CA3AF' }}
                  tickFormatter={(value) => `${value} ${unit}`}
                />
              )}
              
              {actualSeries.map((s, index) => (
                <Line
                  key={index}
                  type="monotone"
                  dataKey={s}
                  stroke={Array.isArray(color) ? color[index % color.length] : color}
                  strokeWidth={1}
                  dot={false}
                  isAnimationActive={true}
                  activeDot={{ r: 2 }}
                  yAxisId={hasDualAxes ? seriesAxisMap[s] : undefined}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
      
      {/* Mini Legend for the card view */}
      {actualSeries.length > 0 && chartData.length > 0 && (
        <div className="px-2 py-1">
          {hasDualAxes ? (
            <div className="grid grid-cols-2 gap-2">
              {/* Left Axis */}
              <div className="text-center">
                <div className="flex gap-1 justify-start flex-wrap px-4">
                  {axisConfig[0].series.map((seriesName) => {
                    const index = actualSeries.indexOf(seriesName);
                    return (
                      <div key={index} className="flex items-center gap-1">
                        <div 
                          className="w-2 h-2 rounded"
                          style={{ backgroundColor: Array.isArray(color) ? color[index % color.length] : color }}
                        ></div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {seriesName}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Right Axis */}
              <div className="text-center">
                <div className="flex gap-1 justify-end flex-wrap px-4">
                  {axisConfig[1].series.map((seriesName) => {
                    const index = actualSeries.indexOf(seriesName);
                    return (
                      <div key={index} className="flex items-center gap-1">
                        <div 
                          className="w-2 h-2 rounded"
                          style={{ backgroundColor: Array.isArray(color) ? color[index % color.length] : color }}
                        ></div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {seriesName}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex gap-2 justify-center flex-wrap">
              {actualSeries.map((seriesName, index) => (
                <div key={index} className="flex items-center gap-1">
                  <div 
                    className="w-2 h-2 rounded"
                    style={{ backgroundColor: Array.isArray(color) ? color[index % color.length] : color }}
                  ></div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {seriesName}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OverviewChart;
