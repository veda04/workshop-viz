// Unit mappings for different measurement types
export const UNIT_MAPPINGS = {
  temperature: '°C',
  temp: '°C',
  pressure: 'bar',
  flow: 'L/min',
  level: 'mm',
  concentration: 'Brix(%)',
  brix: 'Brix(%)',
  voltage: 'V',
  current: 'A',
  speed: 'RPM',
  rpm: 'RPM',
  vibration: 'g',
  acceleration: 'g',
  airflow: 'L/min',
  'air flow': 'L/min',
  usage: '%',
  efficiency: '%',
  quality: '%',
  power: 'kW',
  energy: 'kWh',
  frequency: 'Hz',
  torque: 'Nm',
  distance: 'mm',
  weight: 'kg',
  volume: 'L',
  humidity: '%RH',
  ph: 'pH',
};

/**
 * Get appropriate unit based on title/keyword
 * @param {string} title - The title to search for keywords
 * @returns {string} Unit string or empty string if no match
 */
export const getUnitByTitle = (title) => {
  if (!title || typeof title !== 'string') {
    return '';
  }

  const titleLower = title.toLowerCase();
  
  for (const [keyword, unit] of Object.entries(UNIT_MAPPINGS)) {
    if (titleLower.includes(keyword)) {
      return unit;
    }
  }
  
  return '';
};