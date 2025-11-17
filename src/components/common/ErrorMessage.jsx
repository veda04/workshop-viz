import React from 'react';

const ErrorMessage = ({ message, title = 'Error', padding = 'py-8' }) => {
  return (
    <div className={`w-full flex justify-center items-center bg-red-200 border-2 border-red-400 ${padding}`}>
      <div className="text-center flex flex-row items-center justify-center space-x-4">
        <h3 className="text-xl font-bold text-red-600 mb-1">{title}: </h3>
        <p className="text-red-600">{message}</p>
      </div>
    </div>
  );
};

export default ErrorMessage;
