import React from 'react';

const ErrorMessage = ({ message, title = 'Error' }) => {
  return (
    <div className="w-full flex justify-center items-center py-8">
      <div className="text-center">
        <h3 className="text-xl font-bold text-red-600 mb-2">{title}</h3>
        <p className="text-red-600">{message}</p>
      </div>
    </div>
  );
};

export default ErrorMessage;
