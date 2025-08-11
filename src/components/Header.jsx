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
    <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-200/50 px-6 py-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-8">
          <h1 className="text-4xl font-bold text-gray-900 tracking-wider">
            HURCO
          </h1>
          <div className="bg-gradient-to-r from-green-500 to-green-600 px-4 py-2 rounded-lg shadow-md">
            <span className="text-white font-medium">TEST RUNNING</span>
          </div>
          <div className="relative mr-0 ml-0">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <select 
              className="bg-white border border-gray-300 rounded-lg py-2 pr-3 pl-10 text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              defaultValue="1 hour"
            >
              <option value="1 hour">1 Hour</option>
              <option value="2 hours">2 Hours</option>
              <option value="4 hours">4 Hours</option>
              <option value="8 hours">8 Hours</option>
              <option value="1 day">1 Day</option>
              <option value="2 days">2 Days</option>
              <option value="1 week">1 Week</option>
              <option value="1 month">1 Month</option>
              <option value="3 months">3 Months</option>
              <option value="6 months">6 Months</option>
              <option value="1 year">1 Year</option>
            </select>
          </div>
        </div>
        
        <div className="text-right flex items-center space-x-2">
          <div className="text-xl text-gray-600 uppercase tracking-wide">
            {currentDate} | {currentTime} 
          </div>
          <div className="bg-indigo-500 px-4 py-2 rounded-lg shadow-md flex items-center space-x-2">
            <button className="text-white font-medium" title="Refresh" onClick={() =>window.location.reload()}>
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
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
