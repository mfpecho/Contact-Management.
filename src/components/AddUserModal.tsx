import React, { useState } from 'react';
import { X, User, Mail, Lock, Shield, Hash, Briefcase, Wand2 } from 'lucide-react';
import { UserRole } from '../types';
import { useDatabaseContext } from '../contexts/DatabaseContextSimple';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (userData: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    employeeNumber: string;
    position: string;
    username: string;
  }) => void;
}

export const AddUserModal: React.FC<AddUserModalProps> = ({ isOpen, onClose, onAdd }) => {
  const { generateUsername } = useDatabaseContext();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    username: '',
    role: 'user' as UserRole,
    employeeNumber: '',
    position: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingUsername, setIsGeneratingUsername] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Handle modal animation
  React.useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleGenerateUsername = async () => {
    if (!formData.name || !formData.employeeNumber) {
      setErrors(prev => ({ 
        ...prev, 
        username: 'Please fill in Name and Employee Number first to generate username' 
      }));
      return;
    }

    setIsGeneratingUsername(true);
    try {
      const generatedUsername = await generateUsername(formData.name, formData.employeeNumber);
      setFormData(prev => ({ ...prev, username: generatedUsername }));
      // Clear username error if it exists
      if (errors.username) {
        setErrors(prev => ({ ...prev, username: '' }));
      }
    } catch (error) {
      console.error('Error generating username:', error);
      setErrors(prev => ({ 
        ...prev, 
        username: 'Failed to generate username. Please enter manually.' 
      }));
    } finally {
      setIsGeneratingUsername(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters and numbers';
    }

    if (!formData.employeeNumber.trim()) {
      newErrors.employeeNumber = 'Employee number is required';
    }

    if (!formData.position.trim()) {
      newErrors.position = 'Position is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage('');
    
    try {
      await onAdd(formData);
      
      // Show success message
      setSuccessMessage(`✅ User "${formData.name}" has been successfully created and saved to the Supabase database!`);
      
      // Reset form after a brief delay to show the message
      setTimeout(() => {
        setFormData({
          name: '',
          email: '',
          password: '',
          username: '',
          role: 'user',
          employeeNumber: '',
          position: ''
        });
        setErrors({});
        setSuccessMessage('');
        onClose();
      }, 2500); // Show success message for 2.5 seconds
      
    } catch (error) {
      console.error('Error adding user:', error);
      
      // Show error message
      if (error instanceof Error) {
        setErrors({ submit: error.message });
      } else {
        setErrors({ submit: 'Failed to create user. Please try again.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        name: '',
        email: '',
        password: '',
        username: '',
        role: 'user',
        employeeNumber: '',
        position: ''
      });
      setErrors({});
      onClose();
    }
  };

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 bg-black transition-opacity duration-300 flex items-center justify-center z-50 p-4 ${
        isOpen ? 'bg-opacity-50' : 'bg-opacity-0'
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          handleClose();
        }
      }}
    >
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto transform transition-all duration-300 ${
        isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-black dark:text-white">Add New User</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Create a new user account</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            title="Close modal"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Success/Error Messages */}
        {(successMessage || errors.submit) && (
          <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700">
            {successMessage && (
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300">{successMessage}</p>
              </div>
            )}
            {errors.submit && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <X className="w-2 h-2 text-white" />
                </div>
                <p className="text-sm text-red-700 dark:text-red-300">{errors.submit}</p>
              </div>
            )}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Full Name
              </div>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-black dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors ${
                errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Enter full name"
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </div>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-black dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors ${
                errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Enter email address"
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
            )}
          </div>

          {/* Username Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Username
                </div>
                <button
                  type="button"
                  onClick={handleGenerateUsername}
                  disabled={isSubmitting || isGeneratingUsername || !formData.name || !formData.employeeNumber}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Generate username from name and employee number"
                >
                  {isGeneratingUsername ? (
                    <>
                      <div className="w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-3 h-3" />
                      Generate
                    </>
                  )}
                </button>
              </div>
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-black dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors ${
                  errors.username ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Enter username or generate from name + employee number"
                disabled={isSubmitting}
              />
            </div>
            {errors.username && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.username}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Password
              </div>
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-black dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors ${
                errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Enter password"
              disabled={isSubmitting}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
            )}
          </div>

          {/* Employee Number Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4" />
                Employee Number
              </div>
            </label>
            <input
              type="text"
              value={formData.employeeNumber}
              onChange={(e) => handleInputChange('employeeNumber', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-black dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors ${
                errors.employeeNumber ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Enter employee number"
              disabled={isSubmitting}
            />
            {errors.employeeNumber && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.employeeNumber}</p>
            )}
          </div>

          {/* Position Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Position
              </div>
            </label>
            <input
              type="text"
              value={formData.position}
              onChange={(e) => handleInputChange('position', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-black dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors ${
                errors.position ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Enter job position"
              disabled={isSubmitting}
            />
            {errors.position && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.position}</p>
            )}
          </div>

          {/* Role Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Role
              </div>
            </label>
            <select
              value={formData.role}
              onChange={(e) => handleInputChange('role', e.target.value as UserRole)}
              title="Select user role"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-black dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors"
              disabled={isSubmitting}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="superadmin">Super Admin</option>
            </select>
          </div>

          {/* Role Description */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
              <p className="text-sm text-blue-800 dark:text-blue-200">
                {formData.role === 'user' && 'Regular user with basic access to personal contacts.'}
                {formData.role === 'admin' && 'Administrator with access to user management and advanced features.'}
                {formData.role === 'superadmin' && 'Super administrator with full system access including changelog and system settings.'}
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Adding...
                </>
              ) : (
                <>
                  <User className="w-4 h-4" />
                  Add User
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
