import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../../services/apiService';

const DashboardForm = ({ onClose }) => {
  const navigate = useNavigate();
  
  // Form state
  const [dashboardType, setDashboardType] = useState('machine'); // 'machine' or 'generic'
  const [title, setTitle] = useState('');
  const [selectedMachine, setSelectedMachine] = useState('');
  const [selectedMachineId, setSelectedMachineId] = useState('');
  const [createdBy, setCreatedBy] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data from APIs
  const [machines, setMachines] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingMachines, setLoadingMachines] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Fetch machines and users on component mount
  useEffect(() => {
    const fetchData = async () => {
      // Fetch machines with config
      setLoadingMachines(true);
      try {
        const machinesResponse = await apiService.getMachinesWithConfig();
        if (machinesResponse.status === 'success') {
          setMachines(machinesResponse.data);
        }
      } catch (err) {
        console.error('Error fetching machines:', err);
      } finally {
        setLoadingMachines(false);
      }

      // Fetch users
      setLoadingUsers(true);
      try {
        const usersResponse = await apiService.getUserList();
        if (usersResponse.status === 'success') {
          setUsers(usersResponse.data);
        }
      } catch (err) {
        console.error('Error fetching users:', err);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchData();
  }, []);

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!title.trim()) {
      newErrors.title = 'Dashboard title is required';
    }

    if (dashboardType === 'machine' && !selectedMachine) {
      newErrors.machine = 'Please select a machine';
    }

    if (!selectedUserId) {
      newErrors.createdBy = 'Please select a user';
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

    setIsSubmitting(true);

    try {
      // Create dashboard via API
      const response = await apiService.createDashboard({
        title: title,
        dashboardType: dashboardType,
        machineName: dashboardType === 'machine' ? selectedMachine : '',
        userId: selectedUserId
      });

      if (response.status === 'success') {
        // Close modal
        onClose();
        
        // Navigate to dashboard summary with the new dashboard ID, title, and machineName
        const params = new URLSearchParams({
          dashboardId: response.data.dashboardId,
          title: response.data.title
        });
        
        // Add machineName if it exists (for machine-specific dashboards)
        if (response.data.machineName) {
          params.append('machineName', response.data.machineName);
        }
        navigate(`/dashboard-summary?${params.toString()}`);
      } else {
        setErrors({ submit: response.message || 'Failed to create dashboard' });
        setIsSubmitting(false);
      }

    } catch (error) {
      console.error('Error creating dashboard:', error);
      setErrors({ submit: error.message || 'Failed to create dashboard. Please try again.' });
      setIsSubmitting(false);
    }
  };

  // Handle machine selection change
  const handleMachineChange = (e) => {
    const machineName = e.target.value;
    setSelectedMachine(machineName);
    
    // Find the machine object to get its ID
    const machine = machines.find(m => m.vName === machineName);
    if (machine) {
      setSelectedMachineId(machine.iAsset_id);
    }
  };

  // Handle user selection change
  const handleUserChange = (e) => {
    const userId = e.target.value;
    setSelectedUserId(userId);
    
    // Find the user object to get their name
    const user = users.find(u => u.iUser_id === parseInt(userId));
    if (user) {
      setCreatedBy(user.vName);
    }
  };

  // Handle dashboard type change
  const handleTypeChange = (type) => {
    setDashboardType(type);
    if (type === 'generic') {
      setSelectedMachine(''); // Clear machine selection for generic
      setSelectedMachineId('');
    }
    // Clear machine error when switching types
    if (errors.machine) {
      setErrors({ ...errors, machine: '' });
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md">
      <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-2 mb-0">
        <h2 className="text-2xl my-3 text-gray-900 dark:text-white">
          Create New Dashboard
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 p-6">
        {/* Dashboard Type - Radio Buttons */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Dashboard Type
          </label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => handleTypeChange('machine')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                dashboardType === 'machine'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Machine Specific
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('generic')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                dashboardType === 'generic'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Generic Dashboard
            </button>
          </div>
        </div>

        {/* Dashboard Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Dashboard Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter dashboard title"
            className={`w-full px-4 py-3 rounded-lg border ${
              errors.title
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
            } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2`}
          />
          {errors.title && (
            <p className="text-red-500 text-sm mt-1">{errors.title}</p>
          )}
        </div>

        {/* Conditional Machine Dropdown - Only for Machine Specific */}
        {dashboardType === 'machine' && (
          <div>
            <label htmlFor="machine" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Dashboard for Machine <span className="text-red-500">*</span>
            </label>
            <select
              id="machine"
              value={selectedMachine}
              onChange={handleMachineChange}
              disabled={loadingMachines}
              className={`w-full px-4 py-3 rounded-lg border ${
                errors.machine
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 disabled:opacity-50`}
            >
              <option value="">{loadingMachines ? 'Loading machines...' : 'Select machine'}</option>
              {machines.map((machine, index) => (
                <option key={index} value={machine.vName}>
                  {machine.vName}
                </option>
              ))}
            </select>
            {errors.machine && (
              <p className="text-red-500 text-sm mt-1">{errors.machine}</p>
            )}
          </div>
        )}

        {/* Created By - Dropdown */}
        <div>
          <label htmlFor="createdBy" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Created By <span className="text-red-500">*</span>
          </label>
          <select
            id="createdBy"
            value={selectedUserId}
            onChange={handleUserChange}
            disabled={loadingUsers}
            className={`w-full px-4 py-3 rounded-lg border ${
              errors.createdBy
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
            } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 disabled:opacity-50`}
          >
            <option value="">{loadingUsers ? 'Loading users...' : 'Select user'}</option>
            {users.map((user, index) => (
              <option key={index} value={user.iUser_id}>
                {user.vName}
              </option>
            ))}
          </select>
          {errors.createdBy && (
            <p className="text-red-500 text-sm mt-1">{errors.createdBy}</p>
          )}
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p className="text-red-600 dark:text-red-400 text-sm">{errors.submit}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition duration-200"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DashboardForm;