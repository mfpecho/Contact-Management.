import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Contact } from '../types';

interface ContactFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (contact: Omit<Contact, 'id' | 'ownerId' | 'ownerName' | 'createdAt'>) => void;
  contact?: Contact;
  mode: 'add' | 'edit';
}

export const ContactFormModal: React.FC<ContactFormModalProps> = ({ isOpen, onClose, onSave, contact, mode }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    birthday: '',
    contactNumber: '',
    company: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (contact && mode === 'edit') {
      setFormData({
        firstName: contact.firstName,
        middleName: contact.middleName,
        lastName: contact.lastName,
        birthday: contact.birthday,
        contactNumber: contact.contactNumber,
        company: contact.company
      });
    } else {
      setFormData({ firstName: '', middleName: '', lastName: '', birthday: '', contactNumber: '', company: '' });
    }
  }, [contact, mode, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    // Enhanced validation with data accuracy checks
    const trimmedFirstName = formData.firstName.trim();
    const trimmedLastName = formData.lastName.trim();
    const trimmedContactNumber = formData.contactNumber.trim();
    const trimmedCompany = formData.company.trim();
    
    if (!trimmedFirstName) {
      newErrors.firstName = 'First name is required';
    } else if (trimmedFirstName.length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    } else if (trimmedFirstName.length > 50) {
      newErrors.firstName = 'First name must be less than 50 characters';
    }
    
    if (!trimmedLastName) {
      newErrors.lastName = 'Last name is required';
    } else if (trimmedLastName.length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    } else if (trimmedLastName.length > 50) {
      newErrors.lastName = 'Last name must be less than 50 characters';
    }
    
    if (!formData.birthday) {
      newErrors.birthday = 'Birthday is required';
    } else {
      // Validate date format and reasonable range
      const selectedDate = new Date(formData.birthday);
      const today = new Date();
      const minDate = new Date(1900, 0, 1);
      
      if (isNaN(selectedDate.getTime())) {
        newErrors.birthday = 'Invalid date format';
      } else if (selectedDate > today) {
        newErrors.birthday = 'Birthday cannot be in the future';
      } else if (selectedDate < minDate) {
        newErrors.birthday = 'Please enter a valid birth year';
      }
    }
    
    if (!trimmedContactNumber) {
      newErrors.contactNumber = 'Contact number is required';
    } else if (trimmedContactNumber.length < 10) {
      newErrors.contactNumber = 'Contact number must be at least 10 digits';
    } else if (trimmedContactNumber.length > 20) {
      newErrors.contactNumber = 'Contact number must be less than 20 characters';
    }
    
    if (!trimmedCompany) {
      newErrors.company = 'Company is required';
    } else if (trimmedCompany.length < 2) {
      newErrors.company = 'Company name must be at least 2 characters';
    } else if (trimmedCompany.length > 100) {
      newErrors.company = 'Company name must be less than 100 characters';
    }
    
    // Optional middle name validation
    if (formData.middleName && formData.middleName.trim().length > 50) {
      newErrors.middleName = 'Middle name must be less than 50 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave(formData);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold">{mode === 'add' ? 'Add New Contact' : 'Edit Contact'}</h2>
          <button onClick={onClose} className="hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition" aria-label="Close modal">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.firstName ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Enter first name"
              />
              {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
              <input
                type="text"
                value={formData.middleName}
                onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter middle name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.lastName ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Enter last name"
              />
              {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Birthday *</label>
              <input
                type="date"
                value={formData.birthday}
                onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.birthday ? 'border-red-500' : 'border-gray-300'}`}
                title="Select birthday"
              />
              {errors.birthday && <p className="text-red-500 text-xs mt-1">{errors.birthday}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number *</label>
              <input
                type="tel"
                value={formData.contactNumber}
                onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.contactNumber ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Enter contact number"
              />
              {errors.contactNumber && <p className="text-red-500 text-xs mt-1">{errors.contactNumber}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.company ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Enter company name"
              />
              {errors.company && <p className="text-red-500 text-xs mt-1">{errors.company}</p>}
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition"
            >
              {mode === 'add' ? 'Add Contact' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
