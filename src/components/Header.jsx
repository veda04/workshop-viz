import React, { useState, useEffect } from 'react';

const Header = () => {
  const [bookingData, setBookingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [airValveOpen, setAirValveOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState('1 hour');
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long', 
    day: 'numeric'
  });
  
  // Digital clock state and effect
  const [currentTime, setCurrentTime] = useState(() => new Date().toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }));

  // Auto-refresh every 20 seconds to fetch latest booking data
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     //console.log('Page reloaded to fetch latest booking data');
  //     window.location.reload();
  //   }, 60000); // 60000 ms = 60 seconds

  //   return () => clearInterval(interval);
  // }, []);

  const [customRangeText, setCustomRangeText] = useState('');

  const handleApplyRange = (type, value) => {
    if(type === 'custom') {
      console.log('Submitting custom range:', value); // value = { from, to }
      
      // Format for display
      const fromDate = new Date(value.from).toLocaleString();
      const toDate = new Date(value.to).toLocaleString();
      const rangeText = `${fromDate} - ${toDate}`;
      setCustomRangeText(rangeText);
      setSelectedRange('custom-applied');
      setShowCustomRange(false); // Hide popup

      fetch(`http://localhost:8000/api/dashboard-config/?from=${encodeURIComponent(value.from)}&to=${encodeURIComponent(value.to)}&machine_name=Hurco`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } else {
      console.log('Submitting predefined range:', value); // value = '1 hour', '2 hours', etc.
      setCustomRangeText(''); // Clear custom range text

      fetch(`http://localhost:8000/api/dashboard-config/?range=${encodeURIComponent(value)}&machine_name=Hurco`, {
        method: 'GET',
        headers: {  
          'Content-Type': 'application/json',
        },
      });
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // get the current machine name from the URL or use a default
  const machineName = new URLSearchParams(window.location.search).get('machine_name') || 'Hurco';  // Fetch the current booking data from the backend
  useEffect(() => {
    const fetchCurrentBooking = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`http://localhost:8000/api/current-booking/?machine_name=${machineName}`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const result = await response.json();
        console.log('Machine booking details:', result);
        
        // Set the booking data from the response
        if (result.status === 'success' && result.data && result.data.length > 0) {
          setBookingData(result.data[0]); // Get the first booking
        } else {
          setBookingData(null);
        }
      } catch (error) {
        console.error('Error fetching current booking:', error);
        setError(error.message);
        setBookingData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentBooking();
  }, [machineName]);

  // Helper function to format timings
  const formatTimings = (booking) => {
    if (!booking) return 'Available';
    
    const startDate = booking.dStart ? new Date(booking.dStart).toLocaleDateString() : '';
    const endDate = booking.dEnd ? new Date(booking.dEnd).toLocaleDateString() : '';
    const startTime = booking.tStart ? new Date(`1970-01-01T${booking.tStart}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
    const endTime = booking.tEnd ? new Date(`1970-01-01T${booking.tEnd}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
    
    if (startDate && endDate) {
      if (startDate === endDate) {
        return `${startDate}`;
      } else {
        return `${startDate} - ${endDate}`;
      }
    }
    
    return 'N/A';
  };

  return (
    <div className="bg-white backdrop-blur-sm shadow-lg border-b border-gray-200/50 px-6 py-4 fixed top-0 left-0 right-0 z-40">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <h1 className="text-4xl font-bold text-gray-900 tracking-wider pr-2">
            {machineName}
          </h1>
          <div
            className={
              loading
                ? "bg-gradient-to-r from-gray-400 to-gray-500 px-4 py-2 rounded-lg shadow-md"
                : bookingData
                ? "bg-gradient-to-r from-orange-400 to-orange-600 px-4 py-2 rounded-lg shadow-md"
                : "bg-gradient-to-r from-green-500 to-green-600 px-4 py-2 rounded-lg shadow-md"
            }
          >
            <span className="text-white font-medium">
              {loading ? 'LOADING...' : bookingData ? 'BOOKED' : 'AVAILABLE'}
            </span>
          </div>
          <div className="relative mr-0 ml-0">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <select 
              className="bg-white border border-gray-300 rounded-lg py-2 pr-3 pl-10 text-gray-700 font-medium focus:outline-none focus:ring-2"
              defaultValue="1 hour"
              value={selectedRange}
              onChange={e => {
                const value = e.target.value;
                setShowCustomRange(value === 'custom');
                setSelectedRange(value);
                if (value !== 'custom') {
                  handleApplyRange('predefined', value);
                }
              }}
            >
              <option value="1h">1 Hour</option>
              <option value="3h">3 Hours</option>
              <option value="6h">6 Hours</option>
              <option value="12h">12 Hours</option>
              <option value="24h">24 Hours</option>
              <option value="2d">2 Days</option>
              <option value="7d">7 Days</option>
              <option value="30d">30 Days</option>
              <option value="90d">90 Days</option>
              <option value="6m">6 Months</option>
              <option value="1y">1 Year</option>
              {customRangeText && (
                <option value="custom-applied" disabled>
                  {customRangeText}
                </option>
              )}
              <option value="custom">Custom</option>
            </select>
          </div>
          {showCustomRange && (
            <div className="absolute top-14 left-64 mt-2 w-96 bg-white border border-gray-300 rounded-lg shadow-lg z-50 p-4">
              <div className="flex flex-col gap-4">
                <div className="flex gap-4 items-center">
                  <label className="font-medium text-gray-700 w-16">From</label>
                  <input
                    type="datetime-local"
                    className="border border-gray-300 rounded px-2 py-1 flex-1"
                    value={customFrom}
                    onChange={e => setCustomFrom(e.target.value)}
                  />
                </div>
                <div className="flex gap-4 items-center">
                  <label className="font-medium text-gray-700 w-16">To</label>
                  <input
                    type="datetime-local"
                    className="border border-gray-300 rounded px-2 py-1 flex-1"
                    value={customTo}
                    onChange={e => setCustomTo(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="bg-blue-600 text-white font-semibold rounded px-4 py-2 mt-2 hover:bg-blue-700 transition disabled:bg-gray-400"
                  onClick={() => handleApplyRange('custom', { from: customFrom, to: customTo })}
                  disabled={!customFrom || !customTo}
                >
                  Apply time range
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="text-center border-l border-r border-gray-300 px-20">
          <h5 className="relative border-b border-gray-300 pb-5 bottom-2">
            <p className="text-lg font-semibold text-gray-800 bg-white absolute mx-auto left-0 right-0 top-1 uppercase w-32">Air Flow</p>
          </h5>
          <div className="mt-2">
          {/* Toggle Switch */}
          <div className="flex justify-center mt-1">
            <label className="flex items-center cursor-pointer">
              <span className="mr-2 uppercase text-red-600 font-semibold">Close</span>
              <input
                type="checkbox"
                className="sr-only"
                checked={airValveOpen}
                onChange={() => setAirValveOpen((prev) => !prev)}
              />
              <div
                className={`w-12 h-6 rounded-full relative transition-colors duration-200 ${
                  airValveOpen ? 'bg-green-500' : 'bg-red-500'
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                    airValveOpen ? 'translate-x-6 left-1' : 'left-1'
                  }`}
                  style={{
                    transform: airValveOpen
                      ? 'translateX(24px)'
                      : 'translateX(0px)',
                  }}
                ></div>
              </div>
              <span className="ml-2 uppercase text-green-600 font-semibold">Open</span>
            </label>
          </div>
          </div>
        </div>
        
        <div className="text-right flex items-center space-x-2 pr-10">
          <div className="text-xl text-gray-600 uppercase tracking-wide">
            {currentDate} | {currentTime} 
          </div>
          <div className="bg-indigo-500 px-2 py-2 rounded-lg shadow-md flex items-center space-x-2">
            <button className="text-white font-medium" title="Refresh" onClick={() => window.location.reload()}>
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      {/* check if bookingData is available */}
      <div className="mt-4 current-booking">
        {(!bookingData) ? (
          <div className="w-full text-center py-3 text-lg text-gray-700 font-semibold yellow-gradient-bg rounded-lg shadow">
            There are no bookings for this machine today 
          </div>
        ) : (
          <>
          <div className="flex justify-between items-center px-3 py-2 yellow-gradient-bg rounded-lg shadow">
            <div>
              <div className="text-sm text-gray-600 uppercase">Booked By:</div>
              <div className="text-xl font-semibold text-gray-900">
                {loading ? 'Loading...' : 
                 error ? 'Error loading' :
                 bookingData?.vbooked_by || 'No Current Booking'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 uppercase">Duration:</div>
              <div className="text-xl font-semibold text-gray-900">
                {loading ? 'Loading...' : 
                 error ? 'Error loading' :
                 bookingData
                   ? `${bookingData.dStart ? new Date(bookingData.dStart).toLocaleDateString() : '-'} (${bookingData.tStart ? bookingData.tStart : '-'}) - ${bookingData.dEnd ? new Date(bookingData.dEnd).toLocaleDateString() : '-'} (${bookingData.tEnd ? bookingData.tEnd : '-'})`
                   : '-'
                }
              </div>
            </div>
          </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Header;
