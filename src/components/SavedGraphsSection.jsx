import React from 'react';
import LoadingSpinner from './common/LoadingSpinner';
import { TrashIcon } from '@heroicons/react/24/outline'

const SavedGraphsSection = ({ savedGraphs, loading, onGraphClick, onGraphDelete }) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <LoadingSpinner height={32} />
        <span className="ml-3 text-gray-600 dark:text-gray-400">Loading saved graphs...</span>
      </div>
    );
  }

  if (!savedGraphs || savedGraphs.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <svg 
          className="mx-auto h-16 w-16 text-gray-400 mb-4" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
          />
        </svg>
        <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mt-2">No saved custom graphs yet</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Create and save a custom graph to see it here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {savedGraphs.map((graph) => (
        <SavedGraphCard
          key={graph.iGraph_id}
          graph={graph}
          onClick={() => onGraphClick(graph)}
          onDelete={() => onGraphDelete(graph.iGraph_id)}
        />
      ))}
    </div>
  );
};

const SavedGraphCard = ({ graph, onClick, onDelete }) => {
  const isAddedToDashboard = graph.cAddToDashboard === 'Y';
  
  // Parse JSON if needed
  const graphTypes = typeof graph.vGraph_types === 'string' 
    ? JSON.parse(graph.vGraph_types) 
    : graph.vGraph_types;
  
  const series = typeof graph.vSeries === 'string' 
    ? JSON.parse(graph.vSeries) 
    : graph.vSeries;
  
  const seriesCount = Object.values(series || {}).flat().length;

  const handleDelete = (e) => {
    e.stopPropagation(); // Prevent triggering the card click
    if (window.confirm('Are you sure you want to delete this custom graph?')) {
      onDelete();
    }
  };
  
  return (
    <div
      onClick={onClick}
      className="relative bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 overflow-hidden group"
    >
      {/* delete icon */}
      <button 
        onClick={handleDelete}
        className="absolute top-3 right-2 z-10 text-red-600 hover:text-red-600 dark:hover:text-red-400 transition-colors p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
        title="Delete graph"
      >
        <TrashIcon className="w-5 h-5" />
      </button>
      {/* Card Content */}
      <div className="p-4">
        <h4 className="text-base font-semibold text-gray-800 dark:text-white mb-3 pr-8 truncate">
          {graph.vTitle}
        </h4>
        
        <div className="mb-4">
          {/* Date and User Info */}
          {/* Graph Types */}
          {/* <div className="flex items-center">
            <svg className="w-4 h-4 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
            <span className="font-medium text-gray-600 dark:text-gray-400">
              {Array.isArray(graphTypes) ? graphTypes.length : 0} graph type(s)
            </span>
          </div> */}

          {/* Series Count */}
          {/* <div className="flex items-center">
            <svg className="w-4 h-4 mr-2 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11 4a1 1 0 10-2 0v4a1 1 0 102 0V7zm-3 1a1 1 0 10-2 0v3a1 1 0 102 0V8zM8 9a1 1 0 00-2 0v2a1 1 0 102 0V9z" clipRule="evenodd" />
            </svg>
            <span className="font-medium text-gray-600 dark:text-gray-400">
              {seriesCount} series selected
            </span>
          </div> */}
          
          <div className="space-y-2 flex justify-between ">
            {/* Created Date */}
            {graph.dtCreated && (
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {new Date(graph.dtCreated).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </span>
              </div>
            )}

            {/* Dashboard Badge */}
            {isAddedToDashboard && (
                <div className="flex items-center mt-3">
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border border-green-300 dark:border-green-700 shadow-sm">
                    <svg 
                    className="w-3 h-3 mr-1" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                    >
                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                    </svg>
                    Dashboard
                </span>
                </div>
            )}
          </div>
          {/* Created By */}
            {graph.vUserName && (
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  Created by: <span className="font-medium">{graph.vUserName}</span>
                </span>
              </div>
            )}
        </div>

        {/* Preview Placeholder with gradient */}
        <div className="h-24 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-700 dark:via-gray-600 dark:to-gray-600 rounded-lg flex items-center justify-center group-hover:from-blue-100 group-hover:via-purple-100 group-hover:to-pink-100 dark:group-hover:from-gray-600 dark:group-hover:via-gray-500 dark:group-hover:to-gray-500 transition-all duration-200">
          <svg 
            className="w-16 h-16 text-blue-300 dark:text-blue-600 opacity-50 group-hover:opacity-70 transition-opacity" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" 
            />
          </svg>
        </div>

        {/* Click to view */}
        <div className="mt-4 text-center">
          <span className="text-xs text-blue-600 dark:text-blue-400 font-medium group-hover:underline">
            Click to load and edit →
          </span>
        </div>
      </div>
    </div>
  );
};

export default SavedGraphsSection;
