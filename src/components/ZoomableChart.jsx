import React, { useState, useRef, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

const ZoomableChart = ({ data, series, color, title }) => {
  // Zoom and pan state
  const [zoomState, setZoomState] = useState({ startIndex: 0, endIndex: data.length - 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const chartRef = useRef(null);

  // Reset zoom when data changes
  useEffect(() => {
    setZoomState({ startIndex: 0, endIndex: data.length - 1 });
  }, [data.length]);

  // Handle mouse wheel zoom
  const handleWheel = (e) => {
    if (data.length === 0) return;
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
      const newEnd = Math.min(data.length - 1, zoomState.endIndex + zoomAmount);
      setZoomState({ startIndex: newStart, endIndex: newEnd });
    }
  };

  // Handle drag pan
  const handleMouseDown = (e) => {
    if (e.button === 0) { // Left mouse button
      e.stopPropagation();
      setIsDragging(true);
      setDragStart(e.clientX);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging || data.length === 0) return;
    
    const diff = dragStart - e.clientX;
    const range = zoomState.endIndex - zoomState.startIndex;
    const panAmount = Math.floor((diff / 800) * range); // Adjust sensitivity for larger screen
    
    if (Math.abs(panAmount) > 0) {
      const newStart = Math.max(0, Math.min(data.length - range - 1, zoomState.startIndex + panAmount));
      const newEnd = newStart + range;
      
      setZoomState({ startIndex: newStart, endIndex: Math.min(data.length - 1, newEnd) });
      setDragStart(e.clientX);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // Reset zoom function
  const handleResetZoom = (e) => {
    e.stopPropagation();
    setZoomState({ startIndex: 0, endIndex: data.length - 1 });
  };

  // Check if zoomed
  const isZoomed = zoomState.startIndex !== 0 || zoomState.endIndex !== data.length - 1;

  // Get zoomed data
  const displayData = data.slice(zoomState.startIndex, zoomState.endIndex + 1);

  return (
    <div className="w-full h-full flex flex-col bg-gray-800 text-white rounded-lg">
      <div className="px-8 pt-8 mb-4">
        <h2 className="text-4xl font-bold text-white text-center flex-1">{title}</h2>
        {isZoomed && (
          <button
            onClick={handleResetZoom}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 absolute right-16 top-9 transform -translate-y-1/2 rounded shadow-lg transition-colors"
            title="Reset Zoom"
          >
            Reset Zoom
          </button>
        )}
      </div>
      
      <div className="flex-1 px-8 pb-4">
        <div 
          ref={chartRef}
          className={`h-full ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={displayData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="time" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 14, fill: '#9CA3AF' }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 14, fill: '#9CA3AF' }}
              />

              {series.map((s, idx) => (
                <Line
                  key={idx}
                  type="monotone"
                  dataKey={s}
                  stroke={color[idx % color.length]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {series && series.length > 0 && (
        <div className="px-8 pb-6">
          <div className="border-t border-gray-600 pt-4">
            <div className="flex flex-wrap justify-center gap-4">
              {series.map((seriesName, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: color[idx % color.length] }}
                  ></div>
                  <span className="text-sm font-medium text-gray-300">
                    {seriesName}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Help text */}
      <div className="px-8 pb-4 text-center">
        <p className="text-xs text-gray-400">
          Use mouse wheel to zoom • Drag to pan
        </p>
      </div>
    </div>
  );
};

export default ZoomableChart;
