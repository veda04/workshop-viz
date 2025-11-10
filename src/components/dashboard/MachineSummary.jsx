import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import Layout from '../layouts/Layout';
import Modal from '../Modal';
import Sensors from './Sensors';
import DashboardBlock from './DashboardBlock';
import ZoomableChart from '../charts/ZoomableChart';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import NotesForm from '../forms/NotesForm';
import { useDashboardData } from '../../hooks/useDashboardData';

import apiService from '../../services/apiService';

const MachineSummary = () => {
  const {dashboardData, loading, error } = useDashboardData('Hurco');
  const [blockLoadingStates, setBlockLoadingStates] = useState({}); // Add per-block loading
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  
  const [modalContent, setModalContent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeModalConfig, setActiveModalConfig] = useState(null); // Track which modal is open
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

  // get random colors for stats
    const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  // get x number of random colors
  const getRandomColors = (num) => {
    const colors = [];
    for (let i = 0; i < num; i++) {
      colors.push(getRandomColor());
    }
    return colors;
  };

  // Predefined distinct colors for charts - each from a different color family
  const CHART_COLORS = [
    '#FF0000', // Red
    '#4ECDC4', // Teal
    '#FFD93D', // Yellow
    '#6BCB77', // Green
    '#4D96FF', // Blue
    '#FF8E53', // Orange
    '#A78BFA', // Purple
    '#F472B6', // Pink
    '#34D399', // Emerald
    '#FBBF24', // Amber
    '#A3E635', // Lime
    '#ffb387ff'  // Peach
  ];

  // Get a specific color by index, cycling through if needed
  const getChartColor = (index) => {
    return CHART_COLORS[index % CHART_COLORS.length];
  }

  // Get an array of fixed colors for multiple series
  const getFixedColors = (num) => {
    const colors = [];
    for (let i = 0; i < num; i++) {
      colors.push(getChartColor(i));
    }
    return colors;
  }

  // Function to get appropriate unit based on title for coolant values
    const UNIT_MAPPINGS = {
      temperature: '°C',
      temp: '°C',
      pressure: 'bar',
      flow: 'L/min',
      level: 'mm',
      concentration: 'Brix(%)',
      brix: 'Brix(%)',
      voltage: 'V',
      current: 'A',
      speed: 'RPM',
      rpm: 'RPM',
      vibration: 'g',
      acceleration: 'g',
      airflow: 'L/min',
      'air flow': 'L/min',
      usage: '%',
      efficiency: '%',
      quality: '%',
      power: 'kW',
    };

    const getUnitByTitle = (title) => {
      const titleLower = title.toLowerCase();
      
      for (const [keyword, unit] of Object.entries(UNIT_MAPPINGS)) {
        if (titleLower.includes(keyword)) {
          return unit;
        }
      }
      
      return '';
    };

  return (
    <Layout>
      <div className="dash-cover p-6 space-y-6">
        <button
          className="fixed top-6_7 right-6 z-50 p-1 bg-yellow-500 text-white rounded-lg shadow hover:bg-yellow-600"
          title="Add Note"
          onClick={() => setIsNotesModalOpen(true)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-white">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75h9a2.25 2.25 0 012.25 2.25v12a2.25 2.25 0 01-2.25 2.25h-9A2.25 2.25 0 015.25 18V5.25A2.25 2.25 0 017.5 3.75zm0 0V6m9-2.25V6m-9 6h9m-9 3h6" />
          </svg>
        </button>
        <div className="flex flex-wrap gap-4">
          {loading && dashboardData.length === 0 && (
            <LoadingSpinner message="Loading dashboard data..." />
          )}
          {error && (
            <ErrorMessage message={error} />
          )}
          {!error && dashboardData && dashboardData.map((item, index) => (
            <div
              key={index}
              className={`sub-blocks ${
                item.config?.Type === 'Graph' ? 'w-full md:w-[calc(33.333%-1rem)] lg:w-[calc(33.333%-1rem)]' : 
                item.config?.Type === 'Stat' ? 'w-[calc(50%-0.5rem)] md:w-[calc(25%-0.75rem)] lg:w-[calc(25%-0.75rem)]' : 
                'w-full md:w-[calc(33.333%-1rem)]'
              } mb-4`}
              data-graph-type={item.config?.Type}
              data-graph-title={item.config?.Title}
            >
              <DashboardBlock
                config={item.config}
                initialData={item.data}
                blockIndex={index}
                getUnitByTitle={getUnitByTitle}
                handleCardClick={handleCardClick}
                handleChartClick={handleChartClick}
                getRandomColors={getRandomColors}
                getFixedColors={getFixedColors}
                isLoading={blockLoadingStates[index]}
              />
            </div>
          ))}
        </div>

        {/* Sensors Section */}
        {!error && dashboardData && dashboardData.map((item, index) => (
          item.sensor_list? (
            <div className="-mt-10 p-0 gap-0 space-y-0" key={index}>
              <Sensors sensorData={item.sensor_list} />
            </div>
          ) : null
        ))}
      </div>

      {/* Chart/Data Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} size="full">
        {modalContent}
      </Modal>

      {/* Notes Modal */}
      <Modal isOpen={isNotesModalOpen} onClose={() => setIsNotesModalOpen(false)} size="large">
        <NotesForm onClose={() =>setIsNotesModalOpen(false)} />
      </Modal>
    </Layout>
  );
};

export default MachineSummary;
