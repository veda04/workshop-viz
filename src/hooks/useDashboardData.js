import {useState, useEffect} from 'react';
import apiService from '../services/apiService';

export const useDashboardData = (machineName, initialRange = '&range=3h') => {
    const [dashboardData, setDashboardData] = useState([]);
    const [loading, setLoading] = useState(true); // Keep for initial load
    const [error, setError] = useState(null);
    const [currentRangeParams, setCurrentRangeParams] = useState('&range=3h');

    //This useEffect handles both initial data load and updates when user changes time range
    // Fetch dashboard data from backend with optional range parameters, rangeParams can be empty (uses backend default) or contain range/custom date filters
    const fetchDashboardData = async (rangeParams = '') => {
        try {
        setError(null); // clear previous error
        
        if (dashboardData.length === 0) { // Only show page-level loading on initial load
            setLoading(true);
        }
        const result = await apiService.getDashboardConfig('Hurco', rangeParams);
        console.log('Fetched dashboard data with params:', rangeParams, result);

        if (result.status === 'success') {
            setDashboardData(result.data);
            console.log('Dashboard data loaded:', result.data);
        } else {
            throw new Error(result.message || 'Failed to load dashboard data');
        }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setError(error.message);
        } finally {
        setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData(currentRangeParams); // Initial data fetch with default 3-hour range when component mounts
    
        // set up auto refresh intervals (60 seconds)
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
      }, [currentRangeParams, machineName]);  // Re-run effect when currentRangeParams change

      return {dashboardData, loading, error, setCurrentRangeParams};
};