import { useState, useEffect } from 'react';
import apiService from '../services/apiService';

export const useBookingData = (machineName) => {
  const [bookingData, setBookingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCurrentBooking = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await apiService.getCurrentBooking(machineName);
        console.log('Fetched current booking data:', result);

        if (result.status === 'success' && result.data && result.data.length > 0) {
          setBookingData(result.data[0]);
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

  return { bookingData, loading, error };
};