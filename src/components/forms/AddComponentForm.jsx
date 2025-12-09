import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../../services/apiService';

const AddComponentForm = ({ onClose, dashboardId, saveableConfig, isEditMode = false, initialData = null }) => {
  const navigate = useNavigate();
  
  // Form state
  const [vTitle, setVTitle] = useState('');
  const [vDescription, setVDescription] = useState('');
  const [iPosition, setIPosition] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestedPosition, setSuggestedPosition] = useState(null);

  // Load initial data for edit mode
  useEffect(() => {
    if (isEditMode && initialData) {
      setVTitle(initialData.vTitle || '');
      setVDescription(initialData.vDescription || '');
      setIPosition(initialData.iPosition?.toString() || '');
    }
  }, [isEditMode, initialData]);

  // Fetch suggested position on component mount (only for create mode)
  useEffect(() => {
    if (!isEditMode && dashboardId) {
      fetchSuggestedPosition();
    }
  }, [dashboardId, isEditMode]);

  const fetchSuggestedPosition = async () => {
    try {
      const response = await apiService.getComponents(dashboardId);
      if (response.success && response.data) {
        // Find max position and suggest next
        const positions = response.data.map(c => c.iPosition);
        const maxPosition = positions.length > 0 ? Math.max(...positions) : 0;
        const nextPosition = maxPosition + 1;
        setSuggestedPosition(nextPosition);
        setIPosition(nextPosition.toString());
      }
    } catch (error) {
      console.error('Error fetching suggested position:', error);
      setSuggestedPosition(1);
      setIPosition('1');
    }
  };

  // Fetch dashboard details and navigate
  const fetchDashboardDetailsAndNavigate = async (dbId) => {
    try {
      // Fetch dashboard details to get title and machineName
      const dashboardsResponse = await apiService.getDashboards();
      if (dashboardsResponse.success) {
        const dashboard = dashboardsResponse.data.find(d => d.iDashboard_id === parseInt(dbId));
        // console.log("Dashboard Response:", dashboard);
        if (dashboard && dashboard.cCategory == "MACH") {
          // Get machine name from asset_id if available
          const machinesResponse = await apiService.getMachinesWithConfig();
          // console.log("Machines response:", machinesResponse);  
          let machineName = '';
          if (machinesResponse.status === 'success') {
            const machine = machinesResponse.data.find(m => m.iAsset_id === dashboard.iAsset_id);
            // console.log("Matched machine:", machine);  
            machineName = machine ? machine.vName : '';
          }
          
          // Navigate with query parameters
          navigate(`/dashboard-summary?dashboardId=${dbId}&title=${encodeURIComponent(dashboard.vTitle)}&machineName=${encodeURIComponent(machineName)}`);
        } else {
          console.log("In else block");
          // Fallback: navigate with dashboardId and title only if category is GENR
          navigate(`/dashboard-summary?dashboardId=${dbId}&title=${encodeURIComponent(dashboard.vTitle)}`);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard details:', error);
      // Fallback: navigate with just dashboardId
      navigate(`/dashboard-summary?dashboardId=${dbId}`);
    }
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!vTitle.trim()) {
      newErrors.vTitle = 'Title is required';
    } else if (vTitle.trim().length > 255) {
      newErrors.vTitle = 'Title must be less than 255 characters';
    }

    if (vDescription.length > 5000) {
      newErrors.vDescription = 'Description is too long (max 5000 characters)';
    }

    const positionNum = parseInt(iPosition);
    if (!iPosition || isNaN(positionNum) || positionNum < 1) {
      newErrors.iPosition = 'Position must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Validate saveableConfig exists
    if (!saveableConfig) {
      setErrors({ submit: 'Please generate a graph before adding to dashboard' });
      return;
    }

    console.log('Submitting component with saveableConfig:', saveableConfig);

    setIsSubmitting(true);

    try {
      const componentData = {
        iDashboard_id: dashboardId,
        vTitle: vTitle.trim(),
        vDescription: vDescription.trim(),
        iPosition: parseInt(iPosition),
        vQuery: saveableConfig
      };
      
      console.log('Component data being sent:', componentData);

      let response;
      if (isEditMode && initialData) {
        // Update existing component
        response = await apiService.updateComponent(initialData.icomponent_id, componentData);
      } else {
        // Create new component
        response = await apiService.createComponent(componentData);
      }

      if (response.success) {
        // Close modal
        onClose();
        
        // Navigate to dashboard summary with query parameters
        // We need to fetch dashboard details to get title and machineName
        fetchDashboardDetailsAndNavigate(dashboardId);
      } else {
        setErrors({ submit: response.error || `Failed to ${isEditMode ? 'update' : 'create'} component` });
        setIsSubmitting(false);
      }

    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} component:`, error);
      setErrors({ submit: error.message || `Failed to ${isEditMode ? 'update' : 'create'} component. Please try again.` });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md">
      <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-2 mb-0">
        <h2 className="text-2xl my-3 text-gray-900 dark:text-white">
           {isEditMode ? 'Update Component' : 'Add Component to Dashboard'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 p-6">
        {/* Component Title */}
        <div>
          <label htmlFor="vTitle" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Component Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="vTitle"
            value={vTitle}
            onChange={(e) => setVTitle(e.target.value)}
            placeholder="e.g., Power Consumption Overview"
            className={`w-full px-4 py-3 bg-white dark:bg-gray-700 border ${
              errors.vTitle ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white transition-all`}
          />
          {errors.vTitle && (
            <p className="mt-1 text-sm text-red-500">{errors.vTitle}</p>
          )}
        </div>

        {/* Component Description */}
        <div>
          <label htmlFor="vDescription" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Description (Optional)
          </label>
          <textarea
            id="vDescription"
            value={vDescription}
            onChange={(e) => setVDescription(e.target.value)}
            placeholder="Add a description for this component..."
            rows={3}
            className={`w-full px-4 py-3 bg-white dark:bg-gray-700 border ${
              errors.vDescription ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white transition-all resize-none`}
          />
          {errors.vDescription && (
            <p className="mt-1 text-sm text-red-500">{errors.vDescription}</p>
          )}
        </div>

        {/* Position */}
        <div>
          <label htmlFor="iPosition" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Position <span className="text-red-500">*</span>
          </label>
          {!isEditMode && suggestedPosition && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
              Suggested position: {suggestedPosition}
            </p>
          )}
          <input
            type="number"
            id="iPosition"
            value={iPosition}
            onChange={(e) => setIPosition(e.target.value)}
            min="1"
            placeholder="Enter position number"
            className={`w-full px-4 py-3 bg-white dark:bg-gray-700 border ${
              errors.iPosition ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white transition-all`}
          />
          {errors.iPosition && (
            <p className="mt-1 text-sm text-red-500">{errors.iPosition}</p>
          )}
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
            Components with the same position will be displayed in the same row
          </p>
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
            {errors.submit}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {isEditMode ? 'Updating...' : 'Adding...'}
              </span>
            ) : (
              isEditMode ? 'Update Component' : 'Add to Dashboard'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddComponentForm;
