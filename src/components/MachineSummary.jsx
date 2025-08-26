import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import Layout from './Layout';
import OverviewChart from './OverviewChart';
import DataCard from './DataCard';
import Modal from './Modal';
import { temperatureData, accelerometerData, currentData, coolantData } from '../data/sampleData';
import Sensors from './Sensors';
import UsageChart from './UsageChart';

const MachineSummary = () => {
  const [modalContent, setModalContent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // fetch the dashboard configuration data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:8000/api/dashboard-config/?machine_name=Hurco')

        if(!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

      const result = await response.json();

      if (result.status === 'success') {
        setDashboardData(result.data);
        console.log('Dashboard data loaded:', result.data);
      }
      else {
        throw new Error(result.message || 'Failed to load dashboard data');
      }
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);  

  const openModal = (content) => {
    setModalContent(content);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalContent(null);
  };

  // handles for chart clicks
  const handleChartClick = (title, data, series = [], color, yAxisDomain) => {
    openModal(
      <div className="w-full h-full flex flex-col bg-gray-800 text-white rounded-lg">
        <h2 className="text-4xl font-bold text-white mb-8 text-center pt-8">{title}</h2>
        <div className="flex-1 px-8 pb-4">
          <div className="h-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="time" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 14, fill: '#9CA3AF' }}
                />
                <YAxis 
                  // domain={yAxisDomain}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 14, fill: '#9CA3AF' }}
                />

                {series.map((s, index) => (
                  <Line
                    key={index}
                    type="monotone"
                    dataKey={s}
                    stroke={color[index % color.length]}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Legend Section */}
        {series && series.length > 0 && (
          <div className="px-8 pb-6">
            <div className="border-t border-gray-600 pt-4">
              <div className="flex flex-wrap justify-center gap-4">
                {series.map((seriesName, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: color[index % color.length] }}
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
      </div>
    );
  };
  
  // handles for card clicks
  const handleCardClick = (title, value, unit) => {
    openModal(
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-300">
        <div className="text-center">
          <h2 className="text-6xl font-bold text-gray-800 mb-12">{title}</h2>
          {value && (
            <div className="text-gray-900 font-bold text-8xl">
              {value} {unit}
            </div>
          )}
        </div>
      </div>
    );
  };

  // series of random colors for the charts
  const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  // get x number of random colors
  const getRandomColors = (num) => {
    const colors = [];
    for (let i = 0; i < num; i++) {
      colors.push(getRandomColor());
    }
    return colors;
  }

  // Function to get appropriate unit based on title for coolant values
  const getUnitByTitle = (title) => {
    const titleLower = title.toLowerCase();
    
    // Temperature related
    if (titleLower.includes('temperature') || titleLower.includes('temp')) {
      return '°C';
    }
    
    // Pressure related
    if (titleLower.includes('pressure')) {
      return 'bar';
    }
    
    // Flow related
    if (titleLower.includes('flow')) {
      return 'L/min';
    }
    
    // Level related
    if (titleLower.includes('level')) {
      return 'mm';
    }
    
    // Concentration related
    if (titleLower.includes('concentration') || titleLower.includes('brix')) {
      return 'Brix(%)';
    }
    
    // Voltage related
    if (titleLower.includes('voltage')) {
      return 'V';
    }
    
    // Current related
    if (titleLower.includes('current')) {
      return 'A';
    }
    
    // Speed/RPM related
    if (titleLower.includes('speed') || titleLower.includes('rpm')) {
      return 'RPM';
    }
    
    // Vibration/acceleration related
    if (titleLower.includes('vibration') || titleLower.includes('acceleration')) {
      return 'g';
    }
    
    // Air related
    if (titleLower.includes('air flow') || titleLower.includes('airflow')) {
      return 'L/min';
    }
    
    // Percentage related
    if (titleLower.includes('usage') || titleLower.includes('efficiency') || titleLower.includes('quality')) {
      return '%';
    }
    
    // Power related
    if (titleLower.includes('power')) {
      return 'kW';
    }
    
    // Default fallback
    return '';
  }

  return (
    <Layout>
      <div className="dash-cover p-6 space-y-6">
        <div className="flex flex-wrap gap-4">
          {loading && (
            <div className="w-full flex justify-center items-center py-8">
              <div className="text-xl text-gray-600 font-bold">Loading content...</div>
            </div>
          )}
          {error && (
            <div className="w-full flex justify-center items-center py-8">
              <div className="text-xl text-red-600">Error: {error}</div>
            </div>
          )}
          {dashboardData && dashboardData.map((item, index) => (
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
              {item.config?.Type === 'Graph' ? (
                <OverviewChart
                  title={item.config?.Title || `Graph ${index + 1}`}
                  series={item.config?.Series || []}
                  data={item.data && item.data.length > 0 ? item.data[0] : []}
                  color={item.config?.Color || getRandomColors(5)}
                  yAxisDomain={item.config?.YAxisDomain || [0, 100]}
                  onClick={() => handleChartClick(item.config?.Title || `Graph ${index + 1}`, item.data[0] || item.data, item.config?.Series, item.config?.Color || getRandomColors(5), item.config?.YAxisDomain || [0, 100])}
                />
              ) : item.config?.Type === 'Stat' ? (
                <DataCard
                  title={item.config?.Title || `Stat ${index + 1}`}
                  value = {item.data?.[0]?.[0]?.value || 'N/A'}
                  textColor={item.config?.TextColor || getRandomColors(1)}
                  unit={item.data?.[0]?.[0]?.value ? item.config?.Unit || getUnitByTitle(item.config?.Title || '') : ''}
                  onClick={item.config?.Maximisable ? () => handleCardClick(item.config?.Title || `Stat ${index + 1}`, item.data?.value, item.config?.Unit || getUnitByTitle(item.config?.Title || '')) : undefined}
                />
              ) : item.config?.Type === 'Usage' ? (
                <UsageChart
                  title={item.config?.Title || `Usage ${index + 1}`}
                  onClick={() => handleChartClick(item.config?.Title || `Usage ${index + 1}`, item.data[0] || item.data, item.config?.Series, item.config?.Color || getRandomColors(5), item.config?.YAxisDomain || [0, 100])}
                />
              ) : item.config?.Type === 'Info' ? (  
                <DataCard
                  title={item.config?.Title || `Info ${index + 1}`}
                  value = {item.data?.[0]?.[0]?.value || 'N/A'}
                  textColor={item.config?.TextColor || getRandomColors(1)}
                  onClick={item.config?.Maximisable ? () => handleCardClick(item.config?.Title || `Info ${index + 1}`, item.data?.value, item.config?.Unit || getUnitByTitle(item.config?.Title || '')) : undefined}
                />
              ) : null}
            </div>
          ))}

        </div>

        {/* Sensors Section */}
        {dashboardData && dashboardData.map((item, index) => (
          item.sensor_list? (
            <div className="-mt-10 p-0 gap-0 space-y-0" key={index}>
              <Sensors sensorData={item.sensor_list} />
            </div>
          ) : null
        ))}
      </div>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        {modalContent}
      </Modal>
    </Layout>
  );
};

export default MachineSummary;
