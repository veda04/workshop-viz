// home page will be the start
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';

const Home = () => {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMachines = async () => {
      try {
        setLoading(true);
        const response = await apiService.getConfigMachineList();
        if (response.status === 'success') {
          setMachines(response.data);
        } else {
          setError(response.message || 'Failed to fetch machine list');
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch machine list');
      } finally {
        setLoading(false);
      }
    };

    fetchMachines();
  }, []);

  const handleMachineSelect = (machineName) => {
    navigate(`/machine-summary?machineName=${machineName}`);
  };

return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 dark:bg-gray-900 p-6">    
            <div className="max-w-2xl w-full bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg hover:shadow-2xl transition-shadow duration-300">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 text-center">
                            Welcome to Workshop Viz
                    </h1>
                    <p className="text-gray-700 dark:text-gray-300 mb-8 text-center">
                            Your comprehensive tool for visualizing and analyzing machine data.
                    </p>

                    {loading && (
                        <LoadingSpinner message="Loading machines..." />
                    )}

                    {error && (
                        <ErrorMessage message={error} />
                    )}

                    {!loading && !error && machines.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white text-center mb-4">
                                Select a Machine to Visualize
                            </h2>
                            <select
                                onChange={(e) => handleMachineSelect(e.target.value)}
                                defaultValue=""
                                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white font-semibold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-md"
                            >
                                <option value="" disabled>
                                    Choose a machine...
                                </option>
                                {machines.map((machineName) => (
                                    <option key={machineName} value={machineName}>
                                        {machineName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {!loading && !error && machines.length === 0 && (
                        <p className="text-gray-700 dark:text-gray-300 text-center">
                            No machines available at the moment.
                        </p>
                    )}
            </div>
    </div>
);
};

export default Home;
