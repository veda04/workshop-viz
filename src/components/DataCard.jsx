import React from 'react';

const DataCard = ({ title, value, textColor="", unit = "", size = "medium", onClick }) => {
  const sizeClasses = {
    small: "p-4 h-24",
    semiMedium: 'p-4 h-28',
    medium: "p-6 h-32",
    large: "p-8 h-40",
    extraLarge: "p-10 h-52"
  };

  return (
    <div 
      className={`
        bg-white rounded-xl shadow-lg border border-gray-200 
        flex flex-col justify-center items-center 
        ${sizeClasses[size]} 
        ${onClick ? 'cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300 hover:border-blue-300' : ''}
        backdrop-blur-sm bg-opacity-90
      `}
      onClick={onClick}
    >                                                     
      <h3 className="text-gray-700 text-lg font-semibold text-center mb-2 text-base leading-tight">
        {title}
      </h3>
      {value && (
        <div className={`${textColor} font-bold text-4xl`}>
          {value} <span className="text-lg font-medium text-gray-600">{unit}</span>
        </div>
      )}
    </div>
  );
};

export default DataCard;
