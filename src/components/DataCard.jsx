import React from 'react';

const DataCard = ({ title, value, unit = "", size = "medium", onClick }) => {
  const sizeClasses = {
    small: "p-4 h-24",
    medium: "p-6 h-32",
    large: "p-8 h-40",
    extraLarge: "p-10 h-52"
  };

  return (
    <div 
      className={`bg-gray-300 rounded-lg flex flex-col justify-center items-center ${sizeClasses[size]} ${onClick ? 'cursor-pointer hover:bg-gray-400 transition-colors' : ''}`}
      onClick={onClick}
    >
      <h3 className="text-gray-800 font-semibold text-center mb-2 text-sm leading-tight">
        {title}
      </h3>
      {value && (
        <div className="text-gray-900 font-bold text-xl">
          {value} {unit}
        </div>
      )}
    </div>
  );
};

export default DataCard;
