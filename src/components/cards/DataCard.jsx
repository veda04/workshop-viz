import React from 'react';

const DataCard = ({ title, value, textColor="txt-gradient-green", unit = "", size = "medium", onClick }) => {
  const sizeClasses = {
    small: "p-4 h-24",
    semiMedium: 'p-4 h-28',
    medium: "p-6 h-32",
    large: "p-8 h-40",
    extraLarge: "p-10 h-52"
  };

  // Helper to round value to 2 decimal places if it's a number
  const formatValue = (val) => {
    if (typeof val === 'number') {
      return val.toFixed(2);
    }
    return val;
  };

  return (
    <div 
      className={`
        bg-white rounded-xl shadow-lg border border-gray-200 
        flex flex-col justify-center items-center 
        dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/50
        dark:border-gray-700  dark:hover:border-blue-600
        ${sizeClasses[size]} 
        ${onClick ? 'cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300 hover:border-blue-300' : ''}
        backdrop-blur-sm bg-opacity-90
      `}
      onClick={onClick}
    >                                                     
      <h3 className="text-black dark:text-white text-lg font-semibold text-center mb-2 text-base leading-tight">
        {title}
      </h3>
      {value && (
        <div style={{color: textColor}} className="font-bold text-4xl">
          {formatValue(value)} <span className="text-lg font-medium text-gray-600 dark:text-white">{unit}</span>
        </div>
      )}
    </div>
  );
};

export default DataCard;
