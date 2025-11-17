import React from 'react';

const Sensors = ({ sensorData }) => {
  return (
    <div className="m-0 p-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
          {sensorData.map((sensor, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700
            hover:shadow-xl transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-600
            backdrop-blur-sm bg-opacity-90
            ">
              <div className="flex justify-between items-start mb-0">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{sensor}</h3>
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm font-medium rounded-full">
                  Loop Recording
                </span>
              </div>
            </div>
          ))}
        </div>
    </div>
  );
};

export default Sensors;
