import { useState, useEffect } from 'react';
import ZoomableChart from '../components/charts/ZoomableChart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

export const useModalManager = (dashboardData, getUnitByTitle) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [activeModalConfig, setActiveModalConfig] = useState(null); // Track which modal is open

  const openModal = (content, config = null) => {
    setModalContent(content);
    setActiveModalConfig(config);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalContent(null);
    setActiveModalConfig(null);
  };
  
  // Update modal content when dashboard data changes (for live updates in enlarged view)
  useEffect(() => {
    if (!isModalOpen || !activeModalConfig) return;

    const { type, index } = activeModalConfig;
    
    if (type === 'chart') {
      const item = dashboardData[index];
      if (!item) return;

      const { title, series, color, yAxisDomain } = activeModalConfig;
      const data = item.data?.[0] || [];

      setModalContent(
        <ZoomableChart 
          data={data}
          series={series}
          color={color}
          title={title}
          unit={item.config?.Unit || getUnitByTitle(item.config?.Title || '')}
        />
      );
    } else if (type === 'card') {
      const item = dashboardData[index];
      if (!item) return;

      const { config } = item;
      const data = item.data;
      const value = data?.[0]?.[0]?.value || 'N/A';
      const unit = config?.Unit || getUnitByTitle(config?.Title || '');

      if (config?.Minimised) {
        setModalContent(
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-300">
            <div className="text-center">
              <h2 className="text-6xl font-bold text-gray-800 mb-12">{config?.Title}</h2>
              {value && (
                <div className="text-gray-900 font-bold text-8xl">
                  {value} {unit}
                </div>
              )}
            </div>
          </div>
        );
      } else {
        setModalContent(
          <ZoomableChart 
            data={data?.[0] || []}
            series={['value']}
            color={['#3B82F6']}
            title={config?.Title}
            unit={unit}
          />
        );
      }
    }
  }, [dashboardData, isModalOpen, activeModalConfig]);

  // handles for chart clicks
  const handleChartClick = (title, data, series = [], color, yAxisDomain, index) => {
    openModal(
      <ZoomableChart 
        data={data}
        series={series}
        color={color}
        title={title}
      />,
      { type: 'chart', index, title, series, color, yAxisDomain }
    );
  };
  
  // handles for card clicks
  const handleCardClick = (item, index) => {
    const { config, data } = item;
    const value = data?.[0]?.[0]?.value || 'N/A';
    const unit = config?.Unit || getUnitByTitle(config?.Title || '');

    if (config?.Minimised) {
      // Show single value
      openModal(
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-300">
          <div className="text-center">
            <h2 className="text-6xl font-bold text-gray-800 mb-12">{config?.Title}</h2>
            {value && (
              <div className="text-gray-900 font-bold text-8xl">
                {value} {unit}
              </div>
            )}
          </div>
        </div>,
        { type: 'card', index, config }
      );
    } else {
      // Show chart with all data points
      openModal(
        <div className="w-full h-full flex flex-col bg-gray-800 text-white rounded-lg">
          <h2 className="text-4xl font-bold text-white mb-8 text-center pt-8">{config?.Title}</h2>
          <div className="flex-1 px-8 pb-4">
            <div className="h-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.[0] || []}>
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
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>,
        { type: 'card', index, config }
      );
    }
  };

  return {
    modalContent,
    isModalOpen,
    activeModalConfig,
    openModal,
    closeModal,
    handleChartClick,
    handleCardClick,
  };
};