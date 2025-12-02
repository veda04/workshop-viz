import React, { useState, useEffect } from 'react';
import { useBookingData } from '../../hooks/useBookingData';
import { ClockIcon, ArrowPathIcon, SunIcon, MoonIcon, Bars3Icon, PencilSquareIcon, HomeIcon } from '@heroicons/react/24/outline';
import { useDarkMode } from '../../context/DarkModeContext';
import SideMenu from './SideMenu';

const Header = ({ machineName, title, isNewDashboard = false }) => {
  const [airValveOpen, setAirValveOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState('3h');
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  //const machineName = new URLSearchParams(window.location.search).get('machine_name') || 'Hurco'; 
  // Only fetch booking data if not a new dashboard
  const { bookingData, loading, error } = useBookingData(isNewDashboard ? null : machineName);
  
  // Determine display title - use provided title or fallback to machineName or default
  const displayTitle = title || machineName || 'Dashboard';

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

  const [customRangeText, setCustomRangeText] = useState('');

  /**
   * Handle time range selection changes
   * Dispatches a custom event to notify other components (MachineSummary, DashboardBlock)
   * about the range change so they can re-fetch data accordingly
   * 
   * @param {string} type - Either 'custom' for custom date range or 'predefined' for preset ranges
   * @param {string|object} value - For predefined: range string (e.g., '1h', '3h'). For custom: {from, to} object
   */
  const handleApplyRange = (type, value) => {
    if(type === 'custom') {
      //console.log('Submitting custom range:', value); // value = { from, to }
      
      // Format custom date range for display in the dropdown
      const fromDate = new Date(value.from).toLocaleString();
      const toDate = new Date(value.to).toLocaleString();
      const rangeText = `${fromDate} - ${toDate}`;
      setCustomRangeText(rangeText);
      setSelectedRange('custom-applied');
      setShowCustomRange(false); // Hide custom range popup

      // Broadcast custom range change event to all listening components
      // Event detail contains type and the from/to datetime values
      window.dispatchEvent(new CustomEvent('rangeChanged', {
        detail: { type: 'custom', from: value.from, to: value.to }
      }));
    } else {
      //console.log('Submitting predefined range:', value); // value = '1h', '3h', '24h', etc.
      setCustomRangeText(''); // Clear any previous custom range text

      // Broadcast predefined range change event to all listening components
      // Event detail contains type and the range value (e.g., '3h', '24h')
      window.dispatchEvent(new CustomEvent('rangeChanged', {
        detail: { type: 'predefined', range: value }
      }));
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
    <div className="bg-white dark:bg-gray-900 backdrop-blur-sm shadow-lg border-b border-gray-200/50 dark:border-gray-700/50 px-6 py-4 fixed top-0 left-0 right-0 z-40 transition-colors duration-200">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          {/* Hamburger Menu Button */}
                <button
                onClick={() => setIsSideMenuOpen(true)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative top-1"
                aria-label="Open menu"
                >
                <Bars3Icon className="w-6 h-6 text-gray-700 dark:text-gray-200" />
                </button>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white pr-2">
                 <a href={`/dashboard-summary`} className="text-4xl font-bold text-gray-900 dark:text-white pr-2 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                  {displayTitle} {machineName} {machineName && <span className="text-xl dark:text-gray-400">({machineName})</span>}
                  </a>
                </h1>
                {!isNewDashboard && (
                <>
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
                  <ClockIcon className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400 mr-2'/>
                  <select 
                    className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg py-2 pr-3 pl-10 text-gray-700 dark:text-gray-200 font-medium focus:outline-none focus:ring-2 transition-colors"
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
                </>
                )}
                {showCustomRange && (
                <div className="absolute top-14 left-64 mt-2 w-96 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 p-4 transition-colors">
                  <div className="flex flex-col gap-4">
                  <div className="flex gap-4 items-center">
                    <label className="font-medium text-gray-700 dark:text-gray-300 w-16">From</label>
                    <input
                    type="datetime-local"
                    className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded px-2 py-1 flex-1 transition-colors"
                    value={customFrom}
                    onChange={e => setCustomFrom(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-4 items-center">
                    <label className="font-medium text-gray-700 dark:text-gray-300 w-16">To</label>
                    <input
                    type="datetime-local"
                    className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded px-2 py-1 flex-1 transition-colors"
                    value={customTo}
                    onChange={e => setCustomTo(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-blue-600 dark:bg-blue-700 text-white font-semibold rounded px-4 py-2 mt-2 hover:bg-blue-700 dark:hover:bg-blue-600 transition disabled:bg-gray-400 dark:disabled:bg-gray-600"
                    onClick={() => handleApplyRange('custom', { from: customFrom, to: customTo })}
                    disabled={!customFrom || !customTo}
                  >
                    Apply time range
                  </button>
                  </div>
                </div>
                )}
              </div>

              {/* Air Flow Block - Hide for new dashboards */}
              {!isNewDashboard && (
                <div className="text-center border-l border-r border-gray-300 dark:border-gray-600 px-20">
                <h5 className="relative border-b border-gray-300 dark:border-gray-600 pb-5 bottom-2">
                  <p className="text-lg font-semibold text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900 absolute mx-auto left-0 right-0 top-1 uppercase w-32">Air Flow</p>
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
        )}
        
        <div className="text-right flex items-center space-x-2 pr-0">
          <div className="text-xl text-gray-600 dark:text-gray-300 uppercase tracking-wide transition-colors">
            {currentDate} | {currentTime} 
          </div>
          <div className="bg-gray-500 dark:bg-yellow-400 px-0 py-0 rounded-lg shadow-md flex items-center space-x-2 transition-colors">
            <button 
              className="text-white font-medium hover:bg-gray-600 hover:dark:bg-yellow-500 p-1 rounded-lg transition-colors" 
              title="Toggle Mode" 
              onClick={toggleDarkMode}
            >
              {isDarkMode ? (
                <SunIcon className="w-6 h-6 text-white" />
              ) : (
                <MoonIcon className="w-6 h-6 text-white" />
              )}
            </button>
          </div>
          
          {/* Refresh and Notes buttons - Hide for new dashboards */}
          {!isNewDashboard && (
            <>
              <div className="bg-indigo-500 dark:bg-indigo-600 px-0 py-0 rounded-lg shadow-md flex items-center space-x-2 transition-colors">
                <button className="text-white font-medium hover:bg-indigo-700 p-1 rounded-lg transition-colors" title="Refresh" onClick={() => window.location.reload()}>
                  <ArrowPathIcon className="w-6 h-6 text-white" />
                </button>
              </div>
              <button
                className="top-6_7 right-6 z-50 p-1 bg-yellow-500 dark:bg-yellow-600 text-white rounded-lg shadow hover:bg-yellow-600 dark:hover:bg-yellow-700 transition-colors"
                title="Make Notes"
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('openNotesModal'))}
              >
                <PencilSquareIcon className="w-6 h-6 text-white" />
              </button>
            </>
          )}
          
          <a
            href="/home"
            title="Go to Home"
            className="bg-green-500 dark:bg-green-600 p-1 rounded-lg shadow-md flex items-center space-x-2 transition-colors"
            aria-label="Go to home"
          >
            <HomeIcon className="w-6 h-6 text-white" />
          </a>
        </div>
      </div>
      
      {/* Booking details section - Hide for new dashboards */}
      {!isNewDashboard ? (
        <div className="mt-4 current-booking">
          {(!bookingData) ? (
            <div className="w-full text-center py-3 text-lg text-gray-700 dark:text-black font-semibold yellow-gradient-bg rounded-lg shadow transition-colors">
              There are no bookings for this machine today 
            </div>
          ) : (
            <>
            <div className="flex justify-between items-center px-3 py-2 yellow-gradient-bg rounded-lg shadow">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-500 uppercase transition-colors">Booked By:</div>
                <div className="text-xl font-semibold text-gray-900 dark:text-black transition-colors">
                  {loading ? 'Loading...' : 
                   error ? 'Error loading' :
                   bookingData?.vbooked_by || 'No Current Booking'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600 dark:text-gray-500 uppercase transition-colors">Duration:</div>
                <div className="text-xl font-semibold text-gray-900 dark:text-black transition-colors">
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
      ) : (
        <>
        <div className="mt-4 current-booking">
            <div className="w-full text-center py-3 text-lg text-gray-700 dark:text-black font-semibold yellow-gradient-bg rounded-lg shadow transition-colors">
              Create your custom dashboard to monitor machine performance and analytics 
            </div>
        </div>
        </>
    
    )}

      {/* Side Menu Component */}
      <SideMenu isOpen={isSideMenuOpen} onClose={() => setIsSideMenuOpen(false)} machineName={machineName} />
    </div>
  );
};

export default Header;
