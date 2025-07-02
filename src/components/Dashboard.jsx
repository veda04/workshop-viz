import React from 'react';
import { Link } from 'react-router-dom';
import Navigation from './Navigation';

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      <div className="flex items-center justify-center pt-20">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
            ECMPG Workshop Dashboard
          </h1>
          
          <div className="space-y-4">
            <Link 
              to="/machine-summary"
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg text-center transition duration-200"
            >
              Machine Summary
            </Link>
            
            <Link 
              to="/sensors"
              className="block w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg text-center transition duration-200"
            >
              Sensor Details
            </Link>
            
            <Link 
              to="/analytics"
              className="block w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg text-center transition duration-200"
            >
              Analytics
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
