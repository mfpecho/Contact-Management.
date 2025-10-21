import React, { useState, useCallback } from 'react';
import { Edit2, Trash2, Download, FileText, Phone, Building2, Calendar, User } from 'lucide-react';
import { Contact, UserRole } from '../types';
import { exportToCSV } from '../utils/csvExport';
import { AdvancedContactFilter } from './AdvancedContactFilter';
import { ContactFilters, applyContactFilters, createEmptyFilters } from '../utils/contactFilters';
import { useIsMobile } from '../hooks/use-mobile';

interface ContactListProps {
  contacts: Contact[];
  currentUserId: string;
  userRole: UserRole;
  onEdit: (contact: Contact) => void;
  onDelete: (id: string) => void;
  onExport?: (contactCount: number) => void;
  onVCFDownload?: (contactId: string, contactName: string) => void;
}

export const ContactList: React.FC<ContactListProps> = ({ contacts, currentUserId, userRole, onEdit, onDelete, onExport, onVCFDownload }) => {
  const isMobile = useIsMobile();
  const [sortField, setSortField] = useState<keyof Contact>('firstName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<ContactFilters>(createEmptyFilters());

  // Handle filter changes from the advanced filter component
  const handleFilterChange = useCallback((newFilters: ContactFilters) => {
    setFilters(newFilters);
  }, []);

  // Apply filters to contacts
  const filteredContacts = applyContactFilters(contacts, filters);

  const sortedContacts = [...filteredContacts].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleSort = (field: keyof Contact) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleVCFDownload = (contact: Contact) => {
    setSelectedContact(contact);
    setShowConfirmDialog(true);
  };

  const handleConfirmDownload = () => {
    if (!selectedContact) return;

    // Generate VCF data
    const vcfData = `BEGIN:VCARD
VERSION:3.0
FN:${selectedContact.firstName} ${selectedContact.middleName} ${selectedContact.lastName}
N:${selectedContact.lastName};${selectedContact.firstName};${selectedContact.middleName};;
ORG:${selectedContact.company}
TEL:${selectedContact.contactNumber}
BDAY:${new Date(selectedContact.birthday).toISOString().split('T')[0].replace(/-/g, '')}
END:VCARD`;

    const blob = new Blob([vcfData], { type: 'text/vcard' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedContact.firstName}_${selectedContact.lastName}.vcf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    // Track download
    if (onVCFDownload && selectedContact) {
      onVCFDownload(selectedContact.id, `${selectedContact.firstName} ${selectedContact.lastName}`);
    }

    // Close dialog
    setShowConfirmDialog(false);
    setSelectedContact(null);
  };

  const handleCancelDownload = () => {
    setShowConfirmDialog(false);
    setSelectedContact(null);
  };

  const handleSelectContact = (contactId: string) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId);
    } else {
      newSelected.add(contactId);
    }
    setSelectedContacts(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedContacts.size === sortedContacts.length) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(sortedContacts.map(contact => contact.id)));
    }
  };

  const handleExport = () => {
    exportToCSV(sortedContacts, 'personal-contacts.csv');
    if (onExport) {
      onExport(sortedContacts.length);
    }
  };

  // Mobile contact card component
  const ContactMobileCard: React.FC<{ contact: Contact }> = ({ contact }) => {
    const canEdit = userRole === 'superadmin' || (userRole === 'user' && contact.ownerId === currentUserId);
    const canDelete = userRole === 'superadmin';

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4 mb-3">
        {/* Header with name and actions */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-start space-x-3 flex-1">
            <input
              type="checkbox"
              checked={selectedContacts.has(contact.id)}
              onChange={() => handleSelectContact(contact.id)}
              title={`Select ${contact.firstName} ${contact.lastName}`}
              className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {contact.firstName} {contact.middleName} {contact.lastName}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                <User className="w-3 h-3 mr-1" />
                {contact.ownerName}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 ml-2">
            <button 
              onClick={() => handleVCFDownload(contact)}
              className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              title="Download VCF"
            >
              <FileText className="w-4 h-4" />
            </button>
            {canEdit && (
              <button 
                onClick={() => onEdit(contact)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Edit contact"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            {canDelete && (
              <button 
                onClick={() => onDelete(contact.id)}
                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Delete contact"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Contact details */}
        <div className="space-y-2">
          {contact.company && (
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Building2 className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">{contact.company}</span>
            </div>
          )}
          
          {contact.contactNumber && (
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
              <a 
                href={`tel:${contact.contactNumber}`}
                className="text-blue-600 dark:text-blue-400 hover:underline truncate"
              >
                {contact.contactNumber}
              </a>
            </div>
          )}
          
          {contact.birthday && (
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>{new Date(contact.birthday).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-xl shadow-lg p-4 md:p-6 transition-colors border border-gray-200 dark:border-gray-800">
      {/* Header */}
      <div className="flex flex-col space-y-4 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Personal Contacts</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {filteredContacts.length} contact{filteredContacts.length !== 1 ? 's' : ''} found
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            {/* Advanced Filter Component */}
            <AdvancedContactFilter
              contacts={contacts}
              userRole={userRole}
              onFilterChange={handleFilterChange}
            />

            <button
              onClick={handleExport}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition border border-blue-500"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export CSV</span>
              <span className="sm:hidden">Export</span>
            </button>
          </div>
        </div>

        {/* Mobile sort controls */}
        {isMobile && (
          <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort by:</label>
            <select
              value={sortField}
              onChange={(e) => handleSort(e.target.value as keyof Contact)}
              title="Select sort field"
              className="ml-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="firstName">First Name</option>
              <option value="lastName">Last Name</option>
              <option value="company">Company</option>
              <option value="birthday">Birthday</option>
              <option value="contactNumber">Phone</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="ml-2 px-3 py-1 bg-blue-600 text-white rounded-md text-sm"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        )}

        {/* Select all for mobile */}
        {isMobile && sortedContacts.length > 0 && (
          <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
            <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={selectedContacts.size === sortedContacts.length && sortedContacts.length > 0}
                onChange={handleSelectAll}
                title="Select all contacts"
                className="mr-2 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              Select All
            </label>
            {selectedContacts.size > 0 && (
              <span className="text-sm text-blue-600 dark:text-blue-400">
                {selectedContacts.size} selected
              </span>
            )}
          </div>
        )}
      </div>

      {/* Selected contacts indicator */}
      {selectedContacts.size > 0 && !isMobile && (
        <div className="mb-4 px-4 py-2 bg-blue-50 dark:bg-blue-900 rounded-lg border border-blue-200 dark:border-blue-700">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            {selectedContacts.size} contact{selectedContacts.size !== 1 ? 's' : ''} selected
          </p>
        </div>
      )}

      {/* Mobile View - Cards */}
      {isMobile ? (
        <div className="space-y-3">
          {sortedContacts.map((contact) => (
            <ContactMobileCard key={contact.id} contact={contact} />
          ))}
        </div>
      ) : (
        /* Desktop View - Table */
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-200 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-center text-xs font-semibold text-black dark:text-white uppercase">
                  <input
                    type="checkbox"
                    title="Select all contacts"
                    checked={selectedContacts.size === sortedContacts.length && sortedContacts.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-black dark:text-white uppercase">VCF</th>
                <th onClick={() => handleSort('firstName')} className="px-4 py-3 text-left text-xs font-semibold text-black dark:text-white uppercase cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">
                  First Name {sortField === 'firstName' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('middleName')} className="px-4 py-3 text-left text-xs font-semibold text-black dark:text-white uppercase cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">
                  Middle Name {sortField === 'middleName' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('lastName')} className="px-4 py-3 text-left text-xs font-semibold text-black dark:text-white uppercase cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">
                  Last Name {sortField === 'lastName' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('birthday')} className="px-4 py-3 text-left text-xs font-semibold text-black dark:text-white uppercase cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">
                  Birthday {sortField === 'birthday' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('contactNumber')} className="px-4 py-3 text-left text-xs font-semibold text-black dark:text-white uppercase cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">
                  Contact {sortField === 'contactNumber' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('company')} className="px-4 py-3 text-left text-xs font-semibold text-black dark:text-white uppercase cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">
                  Company {sortField === 'company' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('ownerName')} className="px-4 py-3 text-left text-xs font-semibold text-black dark:text-white uppercase cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">
                  Created By {sortField === 'ownerName' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-black dark:text-white uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300 dark:divide-gray-700">
              {sortedContacts.map((contact) => {
                const canEdit = userRole === 'superadmin' || (userRole === 'user' && contact.ownerId === currentUserId);
                const canDelete = userRole === 'superadmin';
                
                return (
                  <tr key={contact.id} className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        title={`Select ${contact.firstName} ${contact.lastName}`}
                        checked={selectedContacts.has(contact.id)}
                        onChange={() => handleSelectContact(contact.id)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button 
                        onClick={() => handleVCFDownload(contact)}
                        title="Download VCF"
                        className="text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-black dark:text-white">{contact.firstName}</td>
                    <td className="px-4 py-3 text-sm text-black dark:text-white">{contact.middleName}</td>
                    <td className="px-4 py-3 text-sm text-black dark:text-white">{contact.lastName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{new Date(contact.birthday).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{contact.contactNumber}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{contact.company}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{contact.ownerName}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        {canEdit && (
                          <button onClick={() => onEdit(contact)} title="Edit contact" className="text-black dark:text-white hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button onClick={() => onDelete(contact.id)} title="Delete contact" className="text-black dark:text-white hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        Showing {sortedContacts.length} of {contacts.length} contacts
      </div>

      {/* VCF Download Confirmation Dialog */}
      {showConfirmDialog && selectedContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 max-w-sm sm:max-w-md w-full mx-4 border border-gray-300 dark:border-gray-600">
            <h3 className="text-lg font-semibold text-black dark:text-white mb-4">Download Contact</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm sm:text-base">
              Are you sure you want to download {selectedContact.firstName} {selectedContact.lastName}'s contact information as a VCF file?
            </p>
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={handleCancelDownload}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-center"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDownload}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-center"
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};