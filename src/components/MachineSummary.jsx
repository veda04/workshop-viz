import React from 'react';
import Layout from './Layout';
import OverviewChart from './OverviewChart';
import DataCard from './DataCard';
import { temperatureData, accelerometerData, currentData, coolantData } from '../data/sampleData';

const MachineSummary = () => {
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
          />
          <OverviewChart 
            title="Accelerometer Overview" 
            data={accelerometerData}
            color="#00BFFF"
            yAxisDomain={[0, 2]}
          />
          <OverviewChart 
            title="Current Overview" 
            data={currentData}
            color="#32CD32"
            yAxisDomain={[10, 40]}
          />
        </div>        {/* Coolant Data Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {coolantData.map((item, index) => (
            <DataCard 
              key={index}
              title={item.title} 
              value={item.value} 
              unit={item.unit} 
            />
          ))}
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* DropDown/Probing Overview - Large card */}
          <div className="lg:col-span-2">
            <DataCard title="DropDown_ / Probing Overview" size="large" />
          </div>
          
          {/* Machine Usage */}
          <div>
            <DataCard title="Machine Usage" size="medium" />
          </div>
          
          {/* Additional cards */}
          <div className="space-y-4">
            <DataCard title="" size="small" />
            <DataCard title="" size="small" />
          </div>
        </div>

        {/* Additional bottom cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <DataCard title="" size="small" />
          <DataCard title="" size="small" />
          <DataCard title="" size="small" />
          <DataCard title="" size="small" />
        </div>

        {/* Sensors Section */}
        <div className="bg-gray-400 text-center py-8 rounded-lg">
          <h2 className="text-2xl font-bold text-gray-800">SENSORS</h2>        </div>
      </div>
    </Layout>
  );
};

export default MachineSummary;
