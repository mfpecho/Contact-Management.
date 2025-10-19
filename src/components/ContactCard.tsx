import React from 'react';
import { Edit2, Trash2, Building2, Phone, Calendar, User } from 'lucide-react';
import { Contact, UserRole } from '../types';

interface ContactCardProps {
  contact: Contact;
  currentUserId: string;
  userRole: UserRole;
  onEdit: (contact: Contact) => void;
  onDelete: (id: string) => void;
}

export const ContactCard: React.FC<ContactCardProps> = ({ contact, currentUserId, userRole, onEdit, onDelete }) => {
  const canEdit = userRole === 'superadmin' || (userRole === 'user' && contact.ownerId === currentUserId);
  const canDelete = userRole === 'superadmin';

  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-300 dark:border-gray-700">
      <div className="bg-black dark:bg-white h-2"></div>
      
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-black dark:text-white mb-1">
              {contact.firstName} {contact.middleName} {contact.lastName}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Added by {contact.ownerName}</p>
          </div>
          
          <div className="flex gap-2">
            {canEdit && (
              <button
                onClick={() => onEdit(contact)}
                className="p-2 text-black dark:text-white hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition"
                title="Edit"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => onDelete(contact.id)}
                className="p-2 text-black dark:text-white hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center text-black dark:text-white">
            <Building2 className="w-4 h-4 mr-3 text-gray-600 dark:text-gray-400" />
            <span className="text-sm">{contact.company}</span>
          </div>
          
          <div className="flex items-center text-black dark:text-white">
            <Phone className="w-4 h-4 mr-3 text-gray-600 dark:text-gray-400" />
            <span className="text-sm">{contact.contactNumber}</span>
          </div>
          
          <div className="flex items-center text-black dark:text-white">
            <Calendar className="w-4 h-4 mr-3 text-gray-600 dark:text-gray-400" />
            <span className="text-sm">{new Date(contact.birthday).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
