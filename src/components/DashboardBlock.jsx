import React, { useEffect, useState } from 'react';
import DataCard from './DataCard';
import OverviewChart from './OverviewChart';
import UsageChart from './UsageChart';

const DashboardBlock = ({ 
  config, 
  initialData, 
  blockIndex, 
  getUnitByTitle, 
  handleCardClick, 
  handleChartClick, 
  getRandomColors,
  getFixedColors,
  isLoading = false 
}) => {
  const [data, setData] = useState(initialData);
  const [chartColors] = useState(config?.Color || getFixedColors(12));

  // Sync local data state with parent component's data when it changes
  // This ensures the component updates when MachineSummary fetches new data based on range changes
  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-4 flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Render based on config.Type
  if (config?.Type === 'Graph') {
    return (
      <OverviewChart
        title={config?.Title}
        series={config?.Series || []}
        data={data && data.length > 0 ? data[0] : []}
        color={chartColors}
        yAxisDomain={config?.YAxisDomain || [0, 100]}
        unit={config?.Unit || getUnitByTitle(config?.Title || '')}
        onClick={() => handleChartClick(config?.Title, data[0] || data, config?.Series, chartColors, config?.YAxisDomain || [0, 100], blockIndex)}
      />
    );
  }
  if (config?.Type === 'Stat' ) {
    return (
      <DataCard
        title={config?.Title}
        value={data?.[0]?.[0]?.value || 'N/A'}
        textColor={config?.TextColor || getRandomColors(1)}
        unit={data?.[0]?.[0]?.value ? config?.Unit || getUnitByTitle(config?.Title || '') : ''}
        onClick={config?.Maximisable ? () => handleCardClick({ config, data }, blockIndex) : undefined}
      />
    );
  }
  if (config?.Type === 'Usage') {
    return (
      <UsageChart
        title={config?.Title}
        onClick={() => handleChartClick(config?.Title, data[0] || data, config?.Series, config?.Color || getRandomColors(5), config?.YAxisDomain || [0, 100], blockIndex)}
      />
    );
  }
  /*
   * commented as the air flow will be displayed in the header
   * if (config?.Type === 'Info') {
   *   return (
   *       <DataCard 
   *           title={config?.Title}
   *           value={data?.[0]?.[0]?.value || 'N/A'}
   *           textColor={config?.TextColor || getRandomColors(1)}
   *           onClick={config?.Maximisable ? () => handleCardClick({ config, data }) : undefined}
   *       />
   *   );
   * }
   * ...other types as needed
   */
  return null;
};

export default DashboardBlock;