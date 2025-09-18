import React, { useEffect, useState } from 'react';
import DataCard from './DataCard';
import OverviewChart from './OverviewChart';
import UsageChart from './UsageChart';

const DashboardBlock = ({ config, initialData, blockIndex, getUnitByTitle, handleCardClick, handleChartClick, getRandomColors, reloadInterval = 10000 }) => {
  const [data, setData] = useState(initialData);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBlockData = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/dashboard-config/?machine_name=Hurco');
        const result = await res.json();
        if (result.status === 'success' && result.data && result.data[blockIndex]) {
          setData(result.data[blockIndex].data);
        }
      } catch (e) {
        console.error('Error fetching dashboard data:', e);
        setError(e.message);
      }
    };
    const interval = setInterval(fetchBlockData, reloadInterval);
    return () => clearInterval(interval);
  }, [blockIndex, reloadInterval]);

  // Render based on config.Type
  if (config?.Type === 'Graph') {
    return (
      <OverviewChart
        title={config?.Title}
        series={config?.Series || []}
        data={data && data.length > 0 ? data[0] : []}
        color={config?.Color || getRandomColors(5)}
        yAxisDomain={config?.YAxisDomain || [0, 100]}
        onClick={() => handleChartClick(config?.Title, data[0] || data, config?.Series, config?.Color || getRandomColors(5), config?.YAxisDomain || [0, 100])}
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
        onClick={config?.Maximisable ? () => handleCardClick({ config, data }) : undefined}
      />
    );
  }
  if (config?.Type === 'Usage') {
    return (
      <UsageChart
        title={config?.Title}
        onClick={() => handleChartClick(config?.Title, data[0] || data, config?.Series, config?.Color || getRandomColors(5), config?.YAxisDomain || [0, 100])}
      />
    );
  }
  if (config?.Type === 'Info') {
    return (
        <DataCard 
            title={config?.Title}
            value={data?.[0]?.[0]?.value || 'N/A'}
            textColor={config?.TextColor || getRandomColors(1)}
            onClick={config?.Maximisable ? () => handleCardClick({ config, data }) : undefined}
        />
    );
  }
  // ...other types as needed
  return null;
};

export default DashboardBlock;