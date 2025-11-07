import React from 'react';

const LoadingSpinner = ({ message = "Loading..." }) => {
    return(
        <div className="loader w-full flex justify-center items-center py-8">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">{message}</p>
            </div>
        </div>
    );
};

export default LoadingSpinner;