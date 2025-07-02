import React from 'react';

const Header = () => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long', 
    day: 'numeric'
  });
  
  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return (
    <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-8">
          <h1 className="text-4xl font-bold text-gray-900 tracking-wider">
            HURCO
          </h1>
          <div className="bg-gray-300 px-4 py-2 rounded-lg">
            <span className="text-gray-800 font-medium">TEST RUNNING</span>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-sm text-gray-600 uppercase tracking-wide">
            {currentDate} | {currentTime}
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center mt-4">
        <div>
          <div className="text-sm text-gray-600">BOOKED BY:</div>
          <div className="text-xl font-semibold text-gray-900">Veda Salkar</div>
        </div>
        
        <div className="text-right">
          <div className="text-sm text-gray-600">TIMINGS:</div>
          <div className="text-xl font-semibold text-gray-900">12:00 PM - 1:00 PM</div>
        </div>
      </div>
    </div>
  );
};

export default Header;
