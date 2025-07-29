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
        <div className="flex-1 px-8 pb-8">
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

  return (
    <Layout>
      <div className="dash-cover p-6 space-y-6">
        <div className="flex flex-wrap gap-4">
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
                  data={item.data || []}
                  color={item.config?.Color || getRandomColors(5)}
                  yAxisDomain={item.config?.YAxisDomain || [0, 100]}
                  onClick={() => handleChartClick(item.config?.Title || `Graph ${index + 1}`, item.data, item.config?.Series, item.config?.Color || getRandomColors(5), item.config?.YAxisDomain || [0, 100])}
                />
              ) : item.config?.Type === 'Stat' ? (
                <DataCard
                  title={item.config?.Title || `Stat ${index + 1}`}
                  value={item.data?.value || 'N/A'}
                  textColor={item.config?.TextColor || '#000'}
                  unit={item.config?.Unit || ''}
                  onClick={() => handleCardClick(item.config?.Title || `Stat ${index + 1}`, item.data?.value, item.config?.Unit || '')}
                />
              ) : null}
            </div>
          ))}
        </div>

        {/* Overview Charts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <OverviewChart 
            title="Temperature Overview" 
            data={temperatureData}
            color="#FFA500"
            yAxisDomain={[15, 60]}
            onClick={() => handleChartClick("Temperature Overview", temperatureData, "#FFA500", [15, 60])}
          />
          <OverviewChart 
            title="Accelerometer Overview" 
            data={accelerometerData}
            color="#00BFFF"
            yAxisDomain={[0, 2]}
            onClick={() => handleChartClick("Accelerometer Overview", accelerometerData, "#00BFFF", [0, 2])}
          />
          <OverviewChart 
            title="Current Overview" 
            data={currentData}
            color="#32CD32"
            yAxisDomain={[10, 40]}
            onClick={() => handleChartClick("Current Overview", currentData, "#32CD32", [10, 40])}
          />
        </div>        
        {/* Coolant Data Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {coolantData.map((item, index) => (
            <DataCard 
              key={index}
              title={item.title} 
              value={item.value} 
              textColor={item.textColor} 
              unit={item.unit}
              onClick={() => handleCardClick(item.title, item.value, item.unit)}
            />
          ))}
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* DropDown/Probing Overview - Large card */}
          {/* <div className="">
            <OverviewChart 
              title="DropDown_ / Probing Overview" 
              data={temperatureData}
              color="#FFA500"
              yAxisDomain={[15, 60]}
              onClick={() => handleChartClick("DropDown_ / Probing Overview", temperatureData, "#FFA500", [15, 60])}
            />
          </div> */}
          
          {/* Machine Usage */}
          {/* <div>
            <UsageChart
              title="Machine Usage" 
              onClick={() => handleChartClick("Machine Usage")}
            />
          </div> */}
          
          {/* Additional cards */}
          {/* <div className="space-y-4">
            <DataCard 
              title="Air Flow" 
              size="medium" 
              value ="Air Valve Open"
              onClick={() => handleCardClick("Air Flow")}
            />
            <DataCard 
              title="Supply Voltage/ Current" 
              size="semiMedium" 
              onClick={() => handleCardClick("Supply Voltage/ Current")}
            />
          </div> */}
        </div>

        {/* Sensors Section */}
        {/* <div className="">
          <Sensors />
        </div> */}
      </div>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        {modalContent}
      </Modal>
    </Layout>
  );
};

export default MachineSummary;
