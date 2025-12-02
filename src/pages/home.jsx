// home page will be the start
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import Modal from '../components/Modal';
import DashboardForm from '../components/forms/CreateDashboardForm';

const Home = () => {
  // Dummy data for dashboards (will be replaced with API call later)
  const [dashboards, setDashboards] = useState([
    'Hurco Dashboard',
    'Cincinnati Dashboard',
    'Veda\'s Custom Dashboard',
    'Production Line Monitor'
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const navigate = useNavigate();

  // Commented out API call for Phase 1 & 2
  // useEffect(() => {
  //   const fetchDashboards = async () => {
  //     try {
  //       setLoading(true);
  //       const response = await apiService.getCustomDashboards();
  //       if (response.status === 'success') {
  //         setDashboards(response.data);
  //       } else {
  //         setError(response.message || 'Failed to fetch dashboard list');
  //       }
  //     } catch (err) {
  //       setError(err.message || 'Failed to fetch dashboard list');
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   fetchDashboards();
  // }, []);

  const handleDashboardSelect = (dashboardName) => {
    navigate(`/dashboard?dashboardName=${encodeURIComponent(dashboardName)}`);
  };

  const handleCreateNewClick = () => {
    setIsCreateModalOpen(true);
  };

  const handleModalClose = () => {
    setIsCreateModalOpen(false);
  };

return (
    <>
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 dark:bg-gray-900 p-6">    
        <div className="max-w-2xl w-full bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg hover:shadow-2xl transition-shadow duration-300">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 text-center">
            Welcome to Workshop Visualisation
          </h1>
          <p className="text-gray-700 dark:text-gray-300 mb-8 text-center">
            Your comprehensive tool for visualizing and analyzing machine data.
          </p>

          {loading && (
            <LoadingSpinner message="Loading dashboards..." />
          )}

          {error && (
            <ErrorMessage message={error} />
          )}

          {!loading && !error && dashboards.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-l font-semibold text-gray-900 dark:text-white text-left mb-0">
                Select a dashboard to Visualize
              </h2>
              <select
                onChange={(e) => handleDashboardSelect(e.target.value)}
                defaultValue=""
                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white font-semibold py-3 px-4 
                rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-md"
              >
                <option value="" disabled>
                  Choose a dashboard
                </option>
                {dashboards.map((dashboardName, index) => (
                  <option key={index} value={dashboardName}>
                    {dashboardName}
                  </option>
                ))}
              </select>
              <div className="text-center text-gray-500 dark:text-gray-400 font-semibold">OR</div>
              <div className="mt-4">
                <button
                  onClick={handleCreateNewClick}
                  className="w-full bg-blue-500 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-blue-600 transition duration-200"
                >
                  Create New Dashboard
                </button>
              </div>
            </div>
          )}

          {!loading && !error && dashboards.length === 0 && (
            <p className="text-gray-700 dark:text-gray-300 text-center">
              No dashboards available. Create your first dashboard!
            </p>
          )}
        </div>
      </div>

      {/* Create Dashboard Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={handleModalClose} size="default">
        <DashboardForm onClose={handleModalClose} />
      </Modal>
    </>
);
};

export default Home;
