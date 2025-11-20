import React, { useState, useEffect } from 'react';
import apiService from '../../services/apiService';

const CustomGraphsForm = ({ onClose, machineName, selectedGraphs, selectedSeries, graphConfigs }) => {
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    user_id: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const result = await apiService.getUserList();
        if (result.status === 'success' && result.data) {
          setUsers(result.data);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        setError('Failed to load users');
      }
    };

    fetchUsers();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title || !formData.user_id) {
      setError('Please fill in all required fields');
      return;
    }

    if (!selectedGraphs || selectedGraphs.length === 0) {
      setError('No graph types selected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Prepare data to save
      const graphData = {
        machine_name: machineName,
        title: formData.title,
        user_id: formData.user_id,
        graph_types: selectedGraphs, // Array of graph IDs
        series: selectedSeries, // Object with graphId as key and series array as value
      };

      const result = await apiService.saveCustomGraph(graphData);
      
      if (result.status === 'success') {
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        throw new Error(result.message || 'Failed to save custom graph');
      }
    } catch (error) {
      console.error('Error saving custom graph:', error);
      setError(error.message || 'Failed to save custom graph');
    } finally {
      setLoading(false);
    }
  };

  // Get selected graph titles for display
  const getSelectedGraphTitles = () => {
    return selectedGraphs
      .map(graphId => {
        const config = graphConfigs.find(g => g.id === graphId);
        return config ? config.title : graphId;
      })
      .join(', ');
  };

  // Get selected series for display
  const getSelectedSeriesDisplay = () => {
    return Object.entries(selectedSeries)
      .map(([graphId, seriesArr]) => {
        const config = graphConfigs.find(g => g.id === graphId);
        const graphTitle = config ? config.title : graphId;
        return `${graphTitle}: ${seriesArr.join(', ')}`;
      })
      .join('\n');
  };

  return (
    <div className="custom-graph-form bg-white border rounded-lg p-6 overflow-hidden dark:bg-gray-800 dark:shadow-gray-900/50">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Save Custom Graph</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          Custom graph saved successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Machine Name (Read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
            Machine Name
          </label>
          <input
            type="text"
            value={machineName}
            readOnly
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 dark:bg-gray-900 dark:text-white cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-gray-500"
          />
        </div>

        {/* Graph Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
            Graph Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Enter a name for your custom graph"
            className="w-full px-3 py-2 border border-gray-300 dark:bg-gray-800 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* User Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
            Created By <span className="text-red-500">*</span>
          </label>
          <select
            name="user_id"
            value={formData.user_id}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 dark:bg-gray-800 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select a user</option>
            {users.map((user) => (
              <option key={user.iUser_id} value={user.iUser_id}>
                {user.vName}
              </option>
            ))}
          </select>
        </div>

        {/* Selected Graph Types (Tags) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
            Selected Graph Types
          </label>
          <div className="flex flex-wrap gap-2">
            {selectedGraphs.map(graphId => {
              const config = graphConfigs.find(g => g.id === graphId);
              return (
                <span
                  key={graphId}
                  className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-400 dark:text-orange-800 border border-orange-200 dark:border-orange-700"
                >
                  {config ? config.title : graphId}
                  {config && (
                    <span className="ml-1.5 text-xs text-orange-800 dark:text-orange-800">
                      ({config.unit})
                    </span>
                  )}
                </span>
              );
            })}
            {selectedGraphs.length === 0 && (
              <span className="text-sm text-gray-500 dark:text-gray-400 italic">
                No graph types selected
              </span>
            )}
          </div>
        </div>

        {/* Selected Series (Tags grouped by graph) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
            Selected Series
          </label>
          <div className="space-y-3">
            {Object.entries(selectedSeries).map(([graphId, seriesArr]) => {
              const config = graphConfigs.find(g => g.id === graphId);
              const graphTitle = config ? config.title : graphId;
              return (
                <div key={graphId}>
                  <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                    {graphTitle}:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {seriesArr.map((series, index) => (
                      <span
                        key={`${graphId}-${series}-${index}`}
                        className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border border-green-200 dark:border-green-700"
                      >
                        {series}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
            {Object.keys(selectedSeries).length === 0 && (
              <span className="text-sm text-gray-500 dark:text-gray-400 italic">
                No series selected
              </span>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-md transition-colors"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomGraphsForm;
