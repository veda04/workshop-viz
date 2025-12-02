import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '../components/layouts/Layout';
import Modal from '../components/Modal';
import Sensors from '../components/dashboard/Sensors';
import DashboardBlock from '../components/dashboard/DashboardBlock';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import { useDashboardData } from '../hooks/useDashboardData';
import { useModalManager } from '../hooks/useModalManager';
import {getUnitByTitle} from '../utils/unitUtils';
import { getFixedColors, getRandomColors} from '../utils/chartUtils';

const DashboardSummary = () => {
  const [searchParams] = useSearchParams();
  const dashboardId = searchParams.get('dashboardId');
  const machineName = searchParams.get('machineName'); 
  
  // Determine if this is a new dashboard (has dashboardId)
  const isNewDashboard = dashboardId !== null;
  
  const {dashboardData, loading, error } = useDashboardData(machineName);
  const [blockLoadingStates, setBlockLoadingStates] = useState({}); // Add per-block loading

  const {
    modalContent,
    isModalOpen,
    closeModal,
    handleChartClick,
    handleCardClick,
  } = useModalManager(dashboardData, getUnitByTitle);

  // Handle create new entry button click
  const handleCreateEntry = () => {
    // TODO: Open popup with DashboardBuilder content
    console.log('Create new entry clicked');
  };

  return (
    <Layout> 
      <div className="dash-cover p-6 space-y-6">
        {/* Dashboard Header */}
        {isNewDashboard && (
          <div className="flex justify-center items-center my-6">
            <button
              onClick={handleCreateEntry}
              className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition duration-200 shadow-md"
            >
              Create New Entry
            </button>
          </div>
        )}

        {/* Show loading/error states or dashboard blocks */}
        <div className="flex flex-wrap gap-4">
          {loading && dashboardData.length === 0 && !isNewDashboard && (
            <LoadingSpinner message="Loading dashboard data..." />
          )}
          {error && !isNewDashboard && (
            <ErrorMessage message={error} />
          )}
          
          {/* Empty state for new dashboards */}
          {isNewDashboard && !loading && (
            <div className="w-full text-center py-16">
              <div className="inline-block p-8 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <svg 
                  className="w-24 h-24 mx-auto mb-4 text-gray-400 dark:text-gray-600" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" 
                  />
                </svg>
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  No Dashboard Entries Yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  Click "Create New Entry" to add graphs and data blocks to your dashboard
                </p>
              </div>
            </div>
          )}
          {!error && dashboardData && dashboardData.map((item, index) => (
            <div
              key={index}
              className={`sub-blocks ${
                item.config?.Type === 'Graph' ? 'w-full md:w-[calc(33.333%-0.69rem)] lg:w-[calc(33.333%-0.69rem)]' : 
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

      {/* Chart/Data Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} size="full">
        {modalContent}
      </Modal>
    </Layout>
  );
};

export default DashboardSummary;
