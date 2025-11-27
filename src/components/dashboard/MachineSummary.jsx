import React, { useState, useEffect } from 'react';
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
import { useEditLayout } from '../../context/EditLayoutContext';
import {getUnitByTitle} from '../../utils/unitUtils';
import { getFixedColors, getRandomColors} from '../../utils/chartUtils';

const ReactGridLayout = WidthProvider(RGL);

const MachineSummary = () => {
  const { isEditMode } = useEditLayout();
  const {dashboardData, loading, error } = useDashboardData('Hurco', isEditMode);
  const [blockLoadingStates, setBlockLoadingStates] = useState({});
  const [layout, setLayout] = useState([]);

  const {
    modalContent,
    isModalOpen,
    closeModal,
    handleChartClick,
    handleCardClick,
  } = useModalManager(dashboardData, getUnitByTitle);

  // Generate initial layout based on dashboard data
  useEffect(() => {
    if (dashboardData && dashboardData.length > 0) {
      // Try to load saved layout from localStorage
      const savedLayout = localStorage.getItem('dashboardLayout');
      
      if (savedLayout) {
        try {
          const parsedLayout = JSON.parse(savedLayout);
          // Verify the saved layout matches the current dashboard data length
          if (parsedLayout.length === dashboardData.length) {
            setLayout(parsedLayout);
            return;
          }
        } catch (e) {
          console.error('Error parsing saved layout:', e);
        }
      }
      
      // Generate default layout if no saved layout exists or it's invalid
      const generatedLayout = dashboardData.map((item, index) => {
        const type = item.config?.Type;
        
        // Stat blocks: 25% width = 3 cols out of 12
        // Graph blocks: 33.333% width = 4 cols out of 12
        const width = type === 'Stat' ? 3 : type === 'Graph' ? 4 : 4;
        const height = type === 'Stat' ? 4 : type === 'Graph' ? 8 : 6;
        
        // Calculate position
        let x, y;
        if (type === 'Stat') {
          // Stats: 4 per row (3 cols each)
          x = (index * 3) % 12;
          y = Math.floor((index * 3) / 12) * height;
        } else if (type === 'Graph') {
          // Graphs: 3 per row (4 cols each)
          const graphIndex = dashboardData.slice(0, index).filter(d => d.config?.Type === 'Graph').length;
          x = (graphIndex * 4) % 12;
          y = Math.floor((graphIndex * 4) / 12) * height;
        } else {
          x = (index * 4) % 12;
          y = Math.floor((index * 4) / 12) * height;
        }
        
        return {
          i: index.toString(),
          x: x,
          y: y,
          w: width,
          h: height,
        };
      });
      
      setLayout(generatedLayout);
    }
  }, [dashboardData]);

  const onLayoutChange = (newLayout) => {
    setLayout(newLayout);
  };

  // Save layout when exiting edit mode
  useEffect(() => {
    if (!isEditMode && layout.length > 0) {
      localStorage.setItem('dashboardLayout', JSON.stringify(layout));
    }
  }, [isEditMode, layout]);

  const resetLayout = () => {
    // Clear saved layout from localStorage
    localStorage.removeItem('dashboardLayout');
    
    // Regenerate default layout
    if (dashboardData && dashboardData.length > 0) {
      const generatedLayout = dashboardData.map((item, index) => {
        const type = item.config?.Type;
        
        const width = type === 'Stat' ? 3 : type === 'Graph' ? 4 : 4;
        const height = type === 'Stat' ? 4 : type === 'Graph' ? 8 : 6;
        
        let x, y;
        if (type === 'Stat') {
          x = (index * 3) % 12;
          y = Math.floor((index * 3) / 12) * height;
        } else if (type === 'Graph') {
          const graphIndex = dashboardData.slice(0, index).filter(d => d.config?.Type === 'Graph').length;
          x = (graphIndex * 4) % 12;
          y = Math.floor((graphIndex * 4) / 12) * height;
        } else {
          x = (index * 4) % 12;
          y = Math.floor((index * 4) / 12) * height;
        }
        
        return {
          i: index.toString(),
          x: x,
          y: y,
          w: width,
          h: height,
        };
      });
      
      setLayout(generatedLayout);
    }
  };

  return (
    <Layout> 
      <div className="dash-cover p-6 space-y-6">
        {isEditMode && (
          <div className="mb-4 p-3 bg-purple-100 dark:bg-purple-200 border-2 border-purple-300 dark:border-purple-300 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-purple-800 dark:text-purple-800 font-semibold">
               Edit Layout Mode Active - Drag and resize blocks to customize your dashboard
              </p>
              <button
                onClick={resetLayout}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors shadow-md"
                title="Reset to original layout"
              >
                Reset Layout
              </button>
            </div>
          </div>
        )}
        {loading && dashboardData.length === 0 && (
          <LoadingSpinner message="Loading dashboard data..." />
        )}
        {error && (
          <ErrorMessage message={error} />
        )}
        {!error && dashboardData && layout.length > 0 && (
          <ReactGridLayout
            className="layout"
            layout={layout}
            cols={12}
            rowHeight={25}
            onLayoutChange={onLayoutChange}
            containerPadding={[0, 0]}
            margin={[16, 16]}
            isDraggable={isEditMode}
            isResizable={isEditMode}
            compactType={null}
            preventCollision={false}
          >
            {dashboardData.map((item, index) => (
              <div
                key={index}
                className={`sub-blocks ${isEditMode ? 'cursor-move' : ''}`}
                data-graph-type={item.config?.Type}
                data-graph-title={item.config?.Title}
              >
                <DashboardBlock
                  config={item.config}
                  initialData={item.data}
                  blockIndex={index}
                  getUnitByTitle={getUnitByTitle}
                  handleCardClick={isEditMode ? () => {} : handleCardClick}
                  handleChartClick={isEditMode ? () => {} : handleChartClick}
                  getRandomColors={getRandomColors}
                  getFixedColors={getFixedColors}
                  isLoading={blockLoadingStates[index]}
                  isEditMode={isEditMode}
                />
              </div>
            ))}
          </ReactGridLayout>
        )}

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

export default MachineSummary;
