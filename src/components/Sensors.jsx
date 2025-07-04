import React from 'react';

const Sensors = () => {
  const sensorData = [
    { name: "Temperature Sensor 1", value: "25.4", unit: "°C", status: "Active" },
    { name: "Temperature Sensor 2", value: "26.1", unit: "°C", status: "Active" },
    { name: "Pressure Sensor", value: "1.2", unit: "bar", status: "Active" },
    { name: "Vibration Sensor", value: "0.8", unit: "g", status: "Active" },
    { name: "Flow Sensor", value: "12.5", unit: "L/min", status: "Active" },
    { name: "Level Sensor", value: "78", unit: "%", status: "Active" },
  ];

  return (
    <div className="">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
          {sensorData.map((sensor, index) => (
            <div key={index} className="bg-white p-6 rounded-xl shadow-lg border border-gray-200
            hover:shadow-xl transition-all duration-300 hover:border-blue-300
            backdrop-blur-sm bg-opacity-90
            ">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{sensor.name}</h3>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                  {sensor.status}
                </span>
              </div>
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {sensor.value} <span className="text-lg text-gray-500">{sensor.unit}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${Math.random() * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
    </div>
  );
};

export default Sensors;
