import React, { useState, useEffect } from 'react';

const Header = () => {
  const [bookingData, setBookingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  // get the current machine name from the URL or use a default
  const machineName = new URLSearchParams(window.location.search).get('machine_name') || 'Hurco';

  // Fetch the current booking data from the backend
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
    <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-200/50 px-6 py-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-8">
          <h1 className="text-4xl font-bold text-gray-900 tracking-wider">
            {machineName}
          </h1>
          <div className="bg-gradient-to-r from-green-500 to-green-600 px-4 py-2 rounded-lg shadow-md">
            <span className="text-white font-medium">
              {loading ? 'LOADING...' : bookingData ? 'BOOKED' : 'AVAILABLE'}
            </span>
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
            <button className="text-white font-medium" title="Refresh" onClick={() => window.location.reload()}>
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
          <div className="text-xl font-semibold text-gray-900">
            {loading ? 'Loading...' : 
             error ? 'Error loading' :
             bookingData?.vbooked_by || 'No Current Booking'}
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-sm text-gray-600">Duration:</div>
          <div className="text-xl font-semibold text-gray-900">
            {loading ? 'Loading...' : 
             error ? 'Error loading' :
             formatTimings(bookingData)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
