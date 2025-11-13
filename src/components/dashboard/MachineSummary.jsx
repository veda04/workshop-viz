import React, { useState } from 'react';
import Layout from '../layouts/Layout';
import Modal from '../Modal';
import Sensors from './Sensors';
import DashboardBlock from './DashboardBlock';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import NotesForm from '../forms/NotesForm';
import { useDashboardData } from '../../hooks/useDashboardData';
import { useModalManager } from '../../hooks/useModalManager';
import {getUnitByTitle} from '../../utils/unitUtils';
import { getFixedColors, getRandomColors} from '../../utils/chartUtils';
import { PencilSquareIcon } from '@heroicons/react/24/outline';

const MachineSummary = () => {
  const {dashboardData, loading, error } = useDashboardData('Hurco');
  const [blockLoadingStates, setBlockLoadingStates] = useState({}); // Add per-block loading
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);

  const {
    modalContent,
    isModalOpen,
    closeModal,
    handleChartClick,
    handleCardClick,
  } = useModalManager(dashboardData, getUnitByTitle);

  return (
    <Layout>
      <div className="dash-cover p-6 space-y-6">
        <button
          className="fixed top-6_7 right-6 z-50 p-1 bg-yellow-500 dark:bg-yellow-600 text-white rounded-lg shadow hover:bg-yellow-600 dark:hover:bg-yellow-700 transition-colors"
          title="Add Note"
          onClick={() => setIsNotesModalOpen(true)}
        >
          <PencilSquareIcon className="w-6 h-6 text-white" />
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

      {/* Chart/Data Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} size="full">
        {modalContent}
      </Modal>

      {/* Notes Modal */}
      <Modal isOpen={isNotesModalOpen} onClose={() => setIsNotesModalOpen(false)} size="large">
        <NotesForm onClose={() =>setIsNotesModalOpen(false)} />
      </Modal>
    </Layout>
  );
};

export default MachineSummary;
