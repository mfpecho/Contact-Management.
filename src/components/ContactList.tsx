import React, { useState } from 'react';
import { Search, Edit2, Trash2, Download, FileText } from 'lucide-react';
import { Contact, UserRole } from '../types';
import { exportToCSV } from '../utils/csvExport';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof Contact>('firstName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());

  const filteredContacts = contacts.filter(contact =>
    Object.values(contact).some(value =>
      value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

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

  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-xl shadow-lg p-6 transition-colors border border-gray-200 dark:border-gray-800">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-400 dark:border-gray-600 rounded-lg bg-white dark:bg-black text-black dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white transition-colors"
          />
        </div>
        
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition border border-blue-500"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {selectedContacts.size > 0 && (
        <div className="mb-4 px-4 py-2 bg-blue-50 dark:bg-blue-900 rounded-lg border border-blue-200 dark:border-blue-700">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            {selectedContacts.size} contact{selectedContacts.size !== 1 ? 's' : ''} selected
          </p>
        </div>
      )}

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
                Owner {sortField === 'ownerName' && (sortOrder === 'asc' ? '↑' : '↓')}
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
      
      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        Showing {sortedContacts.length} of {contacts.length} contacts
      </div>

      {/* VCF Download Confirmation Dialog */}
      {showConfirmDialog && selectedContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 max-w-sm sm:max-w-md w-full border border-gray-300 dark:border-gray-600">
            <h3 className="text-lg font-semibold text-black dark:text-white mb-4">Download Contact</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to download {selectedContact.firstName} {selectedContact.lastName}'s contact information as a VCF file?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancelDownload}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDownload}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
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