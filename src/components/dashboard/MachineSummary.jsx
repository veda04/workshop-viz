import React, { useState } from 'react';
import RGL, { WidthProvider } from "react-grid-layout";
import _ from "lodash";
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import Layout from '../layouts/Layout';
import Modal from '../Modal';
import Sensors from './Sensors';
import DashboardBlock from './DashboardBlock';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import { useDashboardData } from '../../hooks/useDashboardData';
import { useModalManager } from '../../hooks/useModalManager';
import {getUnitByTitle} from '../../utils/unitUtils';
import { getFixedColors, getRandomColors} from '../../utils/chartUtils';

const ReactGridLayout = WidthProvider(RGL);

const MachineSummary = () => {
  const {dashboardData, loading, error } = useDashboardData('Hurco');
  const [blockLoadingStates, setBlockLoadingStates] = useState({});

  const [layout, setLayout] = useState(
    dashboardData.map((item, index) => {
      const y = _.result(item, "y") || Math.ceil(Math.random() * 4) + 1;
      return {
        i: `block-${index}`,
        x: (index * 2) % 12,
        y: Math.floor(index / 6) * y,
        w: item.config?.Type === 'Graph' ? 5 : item.config?.Type === 'Stat' ? 3 : 4,
        h: item.config?.Type === 'Stat' ? 1 : 2,
      };
    })
  );

  const onLayoutChange = (newLayout) => {
    setLayout(newLayout);
    localStorage.setItem('dashboardLayout', JSON.stringify(newLayout));
  };

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
        {loading && dashboardData.length === 0 && (
          <LoadingSpinner message="Loading dashboard data..." />
        )}
        {error && (
          <ErrorMessage message={error} />
        )}
        
        {!error && dashboardData && dashboardData.length > 0 && (
          <ReactGridLayout
            className="layout"
            layout={layout}
            rowHeight={300}
            rowWidth={3000}
            cols={12}
            onLayoutChange={onLayoutChange}
            isDraggable={true}
            isResizable={true}
            compactType={null}
            preventCollision={false}
          >
            {dashboardData.map((item, index) => (
              <div
                key={`block-${index}`}
                className={`sub-blocks bg-white ${
                item.config?.Type === 'Graph' ? 'w-full md:w-[calc(33.333%-0.69rem)] lg:w-[calc(33.333%-0.69rem)]' : 
                item.config?.Type === 'Stat' ? 'w-[calc(50%-0.5rem)] md:w-[calc(25%-0.75rem)] lg:w-[calc(25%-0.75rem)]' : 
                'w-full md:w-[calc(33.333%-1rem)]'
              } mb-4`}
                data-graph-type={item.config?.Type}
                data-graph-title={item.config?.Title}
              >
                {/* {index} */}
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
          </ReactGridLayout>
        )}

        {/* Sensors Section */}
        {!error && dashboardData && dashboardData.map((item, index) => (
          item.sensor_list ? (
            <div className="-mt-10 p-0 gap-0 space-y-0" key={`sensor-${index}`}>
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

export default MachineSummary;
