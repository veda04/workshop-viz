import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import Layout from './Layout';
import OverviewChart from './OverviewChart';
import DataCard from './DataCard';
import Modal from './Modal';
import { temperatureData, accelerometerData, currentData, coolantData } from '../data/sampleData';

const MachineSummary = () => {
  const [modalContent, setModalContent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = (content) => {
    setModalContent(content);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalContent(null);
  };

  const handleChartClick = (title, data, color, yAxisDomain) => {
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
                  domain={yAxisDomain}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 14, fill: '#9CA3AF' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={color} 
                  strokeWidth={3}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

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

  return (
    <Layout>
      <div className="p-6 space-y-6">
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
        </div>        {/* Coolant Data Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {coolantData.map((item, index) => (
            <DataCard 
              key={index}
              title={item.title} 
              value={item.value} 
              unit={item.unit} 
              onClick={() => handleCardClick(item.title, item.value, item.unit)}
            />
          ))}
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* DropDown/Probing Overview - Large card */}
          <div className="lg:col-span-2">
            <DataCard 
              title="DropDown_ / Probing Overview" 
              size="extraLarge" 
              onClick={() => handleCardClick("DropDown_ / Probing Overview")}
            />
          </div>
          
          {/* Machine Usage */}
          <div>
            <DataCard 
              title="Machine Usage" 
              size="extraLarge" 
              onClick={() => handleCardClick("Machine Usage")}
            />
          </div>
          
          {/* Additional cards */}
          <div className="space-y-4">
            <DataCard 
              title="Sensor Data" 
              size="small" 
              onClick={() => handleCardClick("Sensor Data")}
            />
            <DataCard 
              title="Performance" 
              size="small" 
              onClick={() => handleCardClick("Performance")}
            />
          </div>
        </div>

        {/* Additional bottom cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <DataCard 
            title="Status A" 
            size="small" 
            onClick={() => handleCardClick("Status A")}
          />
          <DataCard 
            title="Status B" 
            size="small" 
            onClick={() => handleCardClick("Status B")}
          />
          <DataCard 
            title="Status C" 
            size="small" 
            onClick={() => handleCardClick("Status C")}
          />
          <DataCard 
            title="Status D" 
            size="small" 
            onClick={() => handleCardClick("Status D")}
          />
        </div>

        {/* Sensors Section */}
        <div className="bg-gray-400 text-center py-8 rounded-lg">
          <h2 className="text-2xl font-bold text-gray-800">SENSORS</h2>        
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        {modalContent}
      </Modal>
    </Layout>
  );
};

export default MachineSummary;
