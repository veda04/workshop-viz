import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import Layout from './Layout';
import Modal from './Modal';
import Sensors from './Sensors';
import DashboardBlock from './DashboardBlock';
import ZoomableChart from './ZoomableChart';
import LoadingSpinner from './common/LoadingSpinner';
import ErrorMessage from './common/ErrorMessage';

const MachineSummary = () => {
  const [modalContent, setModalContent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState([]);
  const [loading, setLoading] = useState(true); // Keep for initial load
  const [blockLoadingStates, setBlockLoadingStates] = useState({}); // Add per-block loading
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentRangeParams, setCurrentRangeParams] = useState('&range=3h');
  const [activeModalConfig, setActiveModalConfig] = useState(null); // Track which modal is open
 
  // Handle form submission
  const handleNotesSubmit = async (e) => {

    // console.log('Submitting note:', notesData);
    e.preventDefault();
    
    // Validate required fields
    if (!notesData.description || !notesData.category || !notesData.startDate || !notesData.endDate || !notesData.user) {
      alert('Please fill in all required fields');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const response = await fetch('http://localhost:8000/api/add-notes/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notesData)
      });
      
      const result = await response.json();
      
      if (result.status === 'success') {
        alert('Note added successfully!');
        setIsNotesModalOpen(false);
        setNotesData({ description: '', category: '', startDate: '', endDate: '', user: '' });
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error submitting note:', error);
      alert('Failed to submit note. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

    // State for notes modal
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [notesData, setNotesData] = useState({
    description: '',
    category: '',
    startDate: '',
    endDate: '',
    user: ''
  });

  // Example categories and users (replace with API data if needed)
  const categories = ['Category 1', 'Category 2', 'Category 3', 'Category 4'];

  // fetch the user list from the backend
  const [users, setUsers] = useState([]);
  useEffect(() => {
    const fetchUserList = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/user-list/');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const result = await response.json();
        if (result.status === 'success' && result.data) {
          setUsers(result.data);
          console.log('User list loaded:', result.data);
        } else {
          throw new Error(result.message || 'Failed to load user list');
        }
      }
      catch (error) {
        console.error('Error fetching user list:', error);
        setError(error.message);
      }
    };
    fetchUserList();
  }, []);

  // Fetch the dashboard configuration data with support for dynamic time range updates
  // This useEffect handles both initial data load and updates when user changes time range
  useEffect(() => {
    // Fetch dashboard data from backend with optional range parameters
    // rangeParams can be empty (uses backend default) or contain range/custom date filters
    const fetchDashboardData = async (rangeParams = '') => {
      try {
        // clear previous error
        setError(null);

        // Only show page-level loading on initial load
        if (dashboardData.length === 0) {
          setLoading(true);
        }
        
        const url = `http://localhost:8000/api/dashboard-config/?machine_name=Hurco${rangeParams}`;
        console.log('Fetching dashboard data from:', url);
        const response = await fetch(url);

        if(!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // const result = await response.json();
        // handles NaN values in the response (Error fetching dashboard data: SyntaxError: Unexpected token 'N', ..."s_Motor": NaN, "C-Ax"... is not valid JSON)
        const responseText = await response.text(); // Get the response as text first
        const sanitizedText = responseText.replace(/:\s*NaN\b/g, ': null');  // Replace NaN with null to make it valid JSON  
        const result = JSON.parse(sanitizedText);  // parse the sanitized JSON

        if (result.status === 'success') {
          setDashboardData(result.data);
          console.log('Dashboard data loaded:', result.data);
        }
        else {
          throw new Error(result.message || 'Failed to load dashboard data');
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    // Initial data fetch with default 3-hour range when component mounts
    fetchDashboardData(currentRangeParams);

    // set up auto refresh intervals (30 seconds)
    const refreshInterval = setInterval(() => {
      console.log('Auto-refreshing dashboard data...');
      fetchDashboardData(currentRangeParams);
    }, 60000); // 60 seconds

    // Event handler for range changes from the Header component
    // Listens for custom 'rangeChanged' events dispatched when user selects a new time range
    const handleRangeChange = (event) => {
      const { type, range, from, to } = event.detail;
      let rangeParams = '';
      
      // Build query parameters based on range type (predefined or custom date range)
      if (type === 'custom') {
        // Custom date range: use 'from' and 'to' parameters
        rangeParams = `&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
      } else {
        // Predefined range: use 'range' parameter (e.g., '1h', '3h', '24h')
        rangeParams = `&range=${encodeURIComponent(range)}`;
      }
      
      // Re-fetch dashboard data with new range parameters
      setCurrentRangeParams(rangeParams);
      fetchDashboardData(rangeParams);
    };

    // Subscribe to range change events from Header component
    window.addEventListener('rangeChanged', handleRangeChange);

    // Cleanup: Remove event listener when component unmounts to prevent memory leaks
    return () => {
      window.removeEventListener('rangeChanged', handleRangeChange);
      clearInterval(refreshInterval);
    };
  }, [currentRangeParams]);  // Re-run effect when currentRangeParams change

  // Update modal content when dashboard data changes (for live updates in enlarged view)
  useEffect(() => {
    if (!isModalOpen || !activeModalConfig) return;

    const { type, index } = activeModalConfig;
    
    if (type === 'chart') {
      const item = dashboardData[index];
      if (!item) return;

      const { title, series, color, yAxisDomain } = activeModalConfig;
      const data = item.data?.[0] || [];

      setModalContent(
        <ZoomableChart 
          data={data}
          series={series}
          color={color}
          title={title}
          unit={item.config?.Unit || getUnitByTitle(item.config?.Title || '')}
        />
      );
    } else if (type === 'card') {
      const item = dashboardData[index];
      if (!item) return;

      const { config } = item;
      const data = item.data;
      const value = data?.[0]?.[0]?.value || 'N/A';
      const unit = config?.Unit || getUnitByTitle(config?.Title || '');

      if (config?.Minimised) {
        setModalContent(
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-300">
            <div className="text-center">
              <h2 className="text-6xl font-bold text-gray-800 mb-12">{config?.Title}</h2>
              {value && (
                <div className="text-gray-900 font-bold text-8xl">
                  {value} {unit}
                </div>
              )}
            </div>
          </div>
        );
      } else {
        setModalContent(
          <ZoomableChart 
            data={data?.[0] || []}
            series={['value']}
            color={['#3B82F6']}
            title={config?.Title}
            unit={unit}
          />
        );
      }
    }
  }, [dashboardData, isModalOpen, activeModalConfig]);

  const openModal = (content, config = null) => {
    setModalContent(content);
    setActiveModalConfig(config);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalContent(null);
    setActiveModalConfig(null);
  };

  // handles for chart clicks
  const handleChartClick = (title, data, series = [], color, yAxisDomain, index) => {
    openModal(
      <ZoomableChart 
        data={data}
        series={series}
        color={color}
        title={title}
      />,
      { type: 'chart', index, title, series, color, yAxisDomain }
    );
  };
  
  // handles for card clicks
  const handleCardClick = (item, index) => {
    const { config, data } = item;
    const value = data?.[0]?.[0]?.value || 'N/A';
    const unit = config?.Unit || getUnitByTitle(config?.Title || '');

    if (config?.Minimised) {
      // Show single value
      openModal(
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-300">
          <div className="text-center">
            <h2 className="text-6xl font-bold text-gray-800 mb-12">{config?.Title}</h2>
            {value && (
              <div className="text-gray-900 font-bold text-8xl">
                {value} {unit}
              </div>
            )}
          </div>
        </div>,
        { type: 'card', index, config }
      );
    } else {
      // Show chart with all data points
      openModal(
        <div className="w-full h-full flex flex-col bg-gray-800 text-white rounded-lg">
          <h2 className="text-4xl font-bold text-white mb-8 text-center pt-8">{config?.Title}</h2>
          <div className="flex-1 px-8 pb-4">
            <div className="h-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.[0] || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="time" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 14, fill: '#9CA3AF' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 14, fill: '#9CA3AF' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>,
        { type: 'card', index, config }
      );
    }
  };

  // get random colors for stats
    const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  // get x number of random colors
  const getRandomColors = (num) => {
    const colors = [];
    for (let i = 0; i < num; i++) {
      colors.push(getRandomColor());
    }
    return colors;
  };

  // Predefined distinct colors for charts - each from a different color family
  const CHART_COLORS = [
    '#FF0000', // Red
    '#4ECDC4', // Teal
    '#FFD93D', // Yellow
    '#6BCB77', // Green
    '#4D96FF', // Blue
    '#FF8E53', // Orange
    '#A78BFA', // Purple
    '#F472B6', // Pink
    '#34D399', // Emerald
    '#FBBF24', // Amber
    '#A3E635', // Lime
    '#ffb387ff'  // Peach
  ];

  // Get a specific color by index, cycling through if needed
  const getChartColor = (index) => {
    return CHART_COLORS[index % CHART_COLORS.length];
  }

  // Get an array of fixed colors for multiple series
  const getFixedColors = (num) => {
    const colors = [];
    for (let i = 0; i < num; i++) {
      colors.push(getChartColor(i));
    }
    return colors;
  }

  // Function to get appropriate unit based on title for coolant values
    const UNIT_MAPPINGS = {
      temperature: '°C',
      temp: '°C',
      pressure: 'bar',
      flow: 'L/min',
      level: 'mm',
      concentration: 'Brix(%)',
      brix: 'Brix(%)',
      voltage: 'V',
      current: 'A',
      speed: 'RPM',
      rpm: 'RPM',
      vibration: 'g',
      acceleration: 'g',
      airflow: 'L/min',
      'air flow': 'L/min',
      usage: '%',
      efficiency: '%',
      quality: '%',
      power: 'kW',
    };

    const getUnitByTitle = (title) => {
      const titleLower = title.toLowerCase();
      
      for (const [keyword, unit] of Object.entries(UNIT_MAPPINGS)) {
        if (titleLower.includes(keyword)) {
          return unit;
        }
      }
      
      return '';
    };

  return (
    <Layout>
      <div className="dash-cover p-6 space-y-6">
        <button
          className="fixed top-6_7 right-6 z-50 p-1 bg-yellow-500 text-white rounded-lg shadow hover:bg-yellow-600"
          title="Add Note"
          onClick={() => setIsNotesModalOpen(true)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-white">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75h9a2.25 2.25 0 012.25 2.25v12a2.25 2.25 0 01-2.25 2.25h-9A2.25 2.25 0 015.25 18V5.25A2.25 2.25 0 017.5 3.75zm0 0V6m9-2.25V6m-9 6h9m-9 3h6" />
          </svg>
        </button>
        <div className="flex flex-wrap gap-4">
          {loading && dashboardData.length === 0 && (
            <LoadingSpinner message="Loading dashboard data..." />
          )}
          {error && (
            <ErrorMessage message={error} />
          )}
          {!error && dashboardData && dashboardData.map((item, index) => (
            <div
              key={index}
              className={`sub-blocks ${
                item.config?.Type === 'Graph' ? 'w-full md:w-[calc(33.333%-1rem)] lg:w-[calc(33.333%-1rem)]' : 
                item.config?.Type === 'Stat' ? 'w-[calc(50%-0.5rem)] md:w-[calc(25%-0.75rem)] lg:w-[calc(25%-0.75rem)]' : 
                'w-full md:w-[calc(33.333%-1rem)]'
              } mb-4`}
              data-graph-type={item.config?.Type}
              data-graph-title={item.config?.Title}
            >
              <DashboardBlock
                config={item.config}
                initialData={item.data}
                blockIndex={index}
                getUnitByTitle={getUnitByTitle}
                handleCardClick={handleCardClick}
                handleChartClick={handleChartClick}
                getRandomColors={getRandomColors}
                getFixedColors={getFixedColors}
                isLoading={blockLoadingStates[index]}
              />
            </div>
          ))}
        </div>

        {/* Sensors Section */}
        {!error && dashboardData && dashboardData.map((item, index) => (
          item.sensor_list? (
            <div className="-mt-10 p-0 gap-0 space-y-0" key={index}>
              <Sensors sensorData={item.sensor_list} />
            </div>
          ) : null
        ))}
      </div>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        {modalContent}
      </Modal>

      {/* Notes Modal */}
      <Modal isOpen={isNotesModalOpen} onClose={() => setIsNotesModalOpen(false)}>
        <div className="p-8 w-2/4 max-w-lg mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 underline text-center">Add Note</h2>
          <form className="space-y-6" onSubmit={handleNotesSubmit}>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Description</label>
              <textarea
                className="w-full p-2 border border-gray-300 rounded"
                rows={4}
                value={notesData.description}
                onChange={e => setNotesData({ ...notesData, description: e.target.value })}
                placeholder="Enter description..."
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Category</label>
              <select
                className="w-full p-2 border border-gray-300 rounded"
                value={notesData.category}
                onChange={e => setNotesData({ ...notesData, category: e.target.value })}
                required
              >
                <option value="">Select category</option>
                {categories.map((cat, idx) => (
                  <option key={idx} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-gray-700 font-semibold mb-2">Start Date</label>
                <input
                  type="datetime-local"
                  className="w-full p-2 border border-gray-300 rounded"
                  value={notesData.startDate}
                  onChange={e => setNotesData({ ...notesData, startDate: e.target.value })}
                  required
                />
              </div>
              <div className="flex-1">
                <label className="block text-gray-700 font-semibold mb-2">End Date</label>
                <input
                  type="datetime-local"
                  className="w-full p-2 border border-gray-300 rounded"
                  value={notesData.endDate}
                  onChange={e => setNotesData({ ...notesData, endDate: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">User</label>
              <select 
                className="w-full p-2 border border-gray-300 rounded"
                value={notesData.user}
                onChange={e => setNotesData({ ...notesData, user: e.target.value })}
                required
              >
                <option value="">Select user</option>
                {users.slice(2, users.length).map((user, idx) => (
                   <option key={idx} value={user.iUser_id}>
                    {user.vName || user.name || user}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-between gap-4 pt-4">
              <button
                type="button"
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                onClick={() => setIsNotesModalOpen(false)}
                disabled={isSubmitting}
              >Cancel</button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                disabled={isSubmitting}
              >{isSubmitting ? 'Saving...' : 'Save'}</button>
            </div>
          </form>
        </div>
      </Modal>
    </Layout>
  );
};

export default MachineSummary;
