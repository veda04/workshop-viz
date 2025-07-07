import React from 'react';

const Sensors = () => {
  const sensorData = [
    { name: "A1-HUR", value: "Loop Recording", status: "Active" },
    { name: "A2-HUR", value: "Manual Recording", status: "Active" },
    { name: "A3-HUR", value: "ATMAS Recording", status: "Active" },
    { name: "C1-HUR", value: "Loop Recording", status: "Active" },
    { name: "T1-HUR", value: "Loop Recording", status: "Active" },
    { name: "Level Sensor", value: "Auto Recording", status: "Active" },
  ];

  return (
    <div className="">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
          {sensorData.map((sensor, index) => (
            <div key={index} className="bg-white p-6 rounded-xl shadow-lg border border-gray-200
            hover:shadow-xl transition-all duration-300 hover:border-blue-300
            backdrop-blur-sm bg-opacity-90
            ">
              <div className="flex justify-between items-start mb-0">
                <h3 className="text-lg font-semibold text-gray-900">{sensor.name}</h3>
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                  {sensor.value}
                </span>
              </div>
            </div>
          ))}
        </div>
    </div>
  );
};

export default Sensors;
