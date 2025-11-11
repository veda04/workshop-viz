export const CHART_COLORS = [
    '#FF0000', // Red
    '#4ECDC4', // Teal
    '#FFD93D', // Yellow
    '#6BCB77', // Green
    '#4D96FF', // Blue
    '#FF8E53', // Orange
    '#A78BFA', // Purple
    '#F472B6', // Pink
    '#34D399', // Emerald
    '#FBBF24', // Amber
    '#A3E635', // Lime
    '#ffb387ff'  // Peach
];

export const getChartColor = (index) => {
  return CHART_COLORS[index % CHART_COLORS.length];
};

export const getFixedColors = (num) => {
  return Array.from({ length: num }, (_, i) => getChartColor(i));
};

export const getRandomColor = () => {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
};

export const getRandomColors = (num) => {
  return Array.from({ length: num }, () => getRandomColor());
};