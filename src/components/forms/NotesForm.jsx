import React, { useState, useEffect } from 'react';
import apiService from '../../services/apiService';

const NotesForm = ({ onClose, machineName = 'Hurco' }) => {
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    machine_name: machineName,
    user_id: '',
    category: '',
    startDate: '',
    endDate: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  // Example categories and users (replace with API data if needed)
  const categories = ['Maintenance', 'Issues', 'Observations', 'Others'];

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
    if (!formData.user_id || !formData.category || !formData.description || !formData.startDate || !formData.endDate) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await apiService.addNotes(formData);
      
      if (result.status === 'success') {
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        throw new Error(result.message || 'Failed to add notes');
      }
    } catch (error) {
      console.error('Error adding notes:', error);
      setError(error.message || 'Failed to submit notes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border rounded-lg p-6 overflow-hidden dark:bg-gray-800 dark:shadow-gray-900/50">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Add Note</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          Note added successfully!
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
            name="machine_name"
            value={formData.machine_name}
            readOnly
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 dark:bg-gray-900 dark:text-white cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-gray-500"
          />
        </div>

        {/* User Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
            User Name <span className="text-red-500">*</span>
          </label>
          <select
            name="user_id"
            value={formData.user_id}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 dark:bg-gray-800 dark:text-white rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500"
            required
          >
            <option value="">Select a user</option>
            {users.map((user, index) => (
              <option key={index} value={user.iUser_id}>
                {user.vName}
              </option>
            ))}
          </select>
        </div>

        {/* Category Selection */}
        <div>
            <label className="block text-gray-700 dark:text-white font-semibold mb-2">Category</label>
            <select
            className="w-full p-2 border border-gray-300 rounded dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-gray-500"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            required
            >
            <option value="">Select category</option>
            {categories.map((cat, idx) => (
                <option key={idx} value={cat}>{cat}</option>
            ))}
            </select>
        </div>
        <div className="flex gap-4">
            <div className="flex-1">
                <label className="block text-gray-700 dark:text-white font-semibold mb-2">Start Date</label>
                <input
                    type="datetime-local"
                    className="w-full p-2 border border-gray-300 dark:bg-gray-800 dark:text-white rounded focus:outline-none focus:ring-1 focus:ring-gray-500"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    required
                />
            </div>
            <div className="flex-1">
                <label className="block text-gray-700 dark:text-white font-semibold mb-2">End Date</label>
                <input
                    type="datetime-local"
                    className="w-full p-2 border border-gray-300 rounded dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-gray-500"
                    name="endDate"
                    value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                    required
                />
            </div>
        </div>
        {/* Notes Text Area */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
            Notes/ Description <span className="text-red-500">*</span>
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows="4"
            className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-gray-500"
            placeholder="Enter your notes here..."
            required
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NotesForm;