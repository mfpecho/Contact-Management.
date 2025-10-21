import React, { useState, useRef, useEffect } from 'react';
import { Search, Edit2, Trash2, Download, FileText, Filter, X, ChevronDown, Calendar, Building, User, Phone } from 'lucide-react';
import { Contact, UserRole } from '../types';
import { exportToCSV } from '../utils/csvExport';

interface CollaborativeTableProps {
  contacts: Contact[];
  currentUserId: string;
  currentUserName: string;
  userRole: UserRole;
  onEdit: (contact: Contact) => void;
  onDelete: (id: string) => void;
  onVCFRequest?: (contactId: string, contactName: string, requesterId: string, requesterName: string) => void;
  onExport?: (contactCount: number) => void;
  onVCFDownload?: (contactId: string, contactName: string) => void;
}

export const CollaborativeTable: React.FC<CollaborativeTableProps> = ({ contacts, currentUserId, currentUserName, userRole, onEdit, onDelete, onVCFRequest, onExport, onVCFDownload }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof Contact>('firstName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());

  // Advanced filtering states
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [companyFilter, setCompanyFilter] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('');
  const [phoneFilter, setPhoneFilter] = useState('');
  const [birthdayFromFilter, setBirthdayFromFilter] = useState('');
  const [birthdayToFilter, setBirthdayToFilter] = useState('');
  const [hasActiveFilters, setHasActiveFilters] = useState(false);
  
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setShowAdvancedFilter(false);
      }
    };

    if (showAdvancedFilter) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAdvancedFilter]);

  // Update active filters indicator
  useEffect(() => {
    const hasFilters = companyFilter || ownerFilter || phoneFilter || birthdayFromFilter || birthdayToFilter;
    setHasActiveFilters(!!hasFilters);
  }, [companyFilter, ownerFilter, phoneFilter, birthdayFromFilter, birthdayToFilter]);

  // Get unique values for filter options
  const uniqueCompanies = [...new Set(contacts.map(c => c.company).filter(Boolean))].sort();
  const uniqueOwners = [...new Set(contacts.map(c => c.ownerName).filter(Boolean))].sort();

  const filteredContacts = contacts.filter(contact => {
    // Basic search filter
    const matchesSearch = searchTerm === '' || Object.values(contact).some(value =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Advanced filters
    const matchesCompany = companyFilter === '' || contact.company?.toLowerCase().includes(companyFilter.toLowerCase());
    const matchesOwner = ownerFilter === '' || contact.ownerName?.toLowerCase().includes(ownerFilter.toLowerCase());
    const matchesPhone = phoneFilter === '' || contact.contactNumber?.toLowerCase().includes(phoneFilter.toLowerCase());
    
    // Birthday range filter
    let matchesBirthdayRange = true;
    if (birthdayFromFilter || birthdayToFilter) {
      const contactBirthday = new Date(contact.birthday);
      const fromDate = birthdayFromFilter ? new Date(birthdayFromFilter) : new Date('1900-01-01');
      const toDate = birthdayToFilter ? new Date(birthdayToFilter) : new Date('2100-12-31');
      matchesBirthdayRange = contactBirthday >= fromDate && contactBirthday <= toDate;
    }

    return matchesSearch && matchesCompany && matchesOwner && matchesPhone && matchesBirthdayRange;
  });

  const clearAllFilters = () => {
    setCompanyFilter('');
    setOwnerFilter('');
    setPhoneFilter('');
    setBirthdayFromFilter('');
    setBirthdayToFilter('');
    setSearchTerm('');
  };

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

    const vcfData = `BEGIN:VCARD
VERSION:3.0
FN:${selectedContact.firstName} ${selectedContact.middleName} ${selectedContact.lastName}
N:${selectedContact.lastName};${selectedContact.firstName};${selectedContact.middleName};;
TEL:${selectedContact.contactNumber}
ORG:${selectedContact.company}
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

  const handleSendRequest = () => {
    if (!selectedContact) return;

    if (onVCFRequest) {
      const contactName = `${selectedContact.firstName} ${selectedContact.lastName}`;
      onVCFRequest(selectedContact.id, contactName, currentUserId, currentUserName);
      alert(`Request to download ${contactName}'s contact has been sent to administrators for approval.`);
    } else {
      alert(`Request to download ${selectedContact.firstName} ${selectedContact.lastName}'s contact has been sent to the superadmin for approval.`);
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
    if (selectedContacts.size === 0) return;
    
    const selectedContactData = sortedContacts.filter(contact => 
      selectedContacts.has(contact.id)
    );
    exportToCSV(selectedContactData, 'collaborative-contacts.csv');
    
    if (onExport) {
      onExport(selectedContactData.length);
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-xl shadow-lg p-6 transition-colors border border-gray-200 dark:border-gray-800">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex flex-1 w-full gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-400 dark:border-gray-600 rounded-lg bg-white dark:bg-black text-black dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white transition-colors"
            />
          </div>

          {/* Advanced Filter Button */}
          <div className="relative" ref={filterDropdownRef}>
            <button
              onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition border ${
                hasActiveFilters
                  ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700 border-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 dark:border-gray-600'
              }`}
              title="Advanced Filters"
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
              {hasActiveFilters && (
                <span className="bg-white text-blue-600 rounded-full w-5 h-5 text-xs flex items-center justify-center font-semibold">
                  !
                </span>
              )}
              <ChevronDown className={`w-4 h-4 transition-transform ${showAdvancedFilter ? 'rotate-180' : ''}`} />
            </button>

            {/* Advanced Filter Dropdown */}
            {showAdvancedFilter && (
              <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Advanced Filters</h3>
                    <button
                      onClick={() => setShowAdvancedFilter(false)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      title="Close filters"
                      aria-label="Close advanced filters"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  {/* Company Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Building className="w-4 h-4 inline mr-1" />
                      Company
                    </label>
                    <select
                      value={companyFilter}
                      onChange={(e) => setCompanyFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      title="Filter by company"
                      aria-label="Filter contacts by company"
                    >
                      <option value="">All Companies</option>
                      {uniqueCompanies.map(company => (
                        <option key={company} value={company}>{company}</option>
                      ))}
                    </select>
                  </div>

                  {/* Creator Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <User className="w-4 h-4 inline mr-1" />
                      Contact Creator
                    </label>
                    <select
                      value={ownerFilter}
                      onChange={(e) => setOwnerFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      title="Filter by contact creator"
                      aria-label="Filter contacts by creator"
                    >
                      <option value="">All Creators</option>
                      {uniqueOwners.map(owner => (
                        <option key={owner} value={owner}>{owner}</option>
                      ))}
                    </select>
                  </div>

                  {/* Phone Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Phone className="w-4 h-4 inline mr-1" />
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={phoneFilter}
                      onChange={(e) => setPhoneFilter(e.target.value)}
                      placeholder="Enter phone number or part of it..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Birthday Range Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Birthday Range
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <input
                          type="date"
                          value={birthdayFromFilter}
                          onChange={(e) => setBirthdayFromFilter(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                          title="From Date"
                        />
                      </div>
                      <div>
                        <input
                          type="date"
                          value={birthdayToFilter}
                          onChange={(e) => setBirthdayToFilter(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                          title="To Date"
                        />
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Leave empty for no date restriction
                    </div>
                  </div>

                  {/* Filter Actions */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={clearAllFilters}
                      className="flex-1 px-3 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded-lg transition text-sm"
                    >
                      Clear All
                    </button>
                    <button
                      onClick={() => setShowAdvancedFilter(false)}
                      className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <button
          onClick={handleExport}
          disabled={selectedContacts.size === 0}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition border ${
            selectedContacts.size === 0
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed border-gray-400'
              : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500'
          }`}
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mb-4 flex flex-wrap gap-2">
          {companyFilter && (
            <div className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
              <Building className="w-3 h-3" />
              Company: {companyFilter}
              <button
                onClick={() => setCompanyFilter('')}
                className="ml-1 text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100"
                title="Remove company filter"
                aria-label="Remove company filter"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          {ownerFilter && (
            <div className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm">
              <User className="w-3 h-3" />
              Created by: {ownerFilter}
              <button
                onClick={() => setOwnerFilter('')}
                className="ml-1 text-green-600 hover:text-green-800 dark:text-green-300 dark:hover:text-green-100"
                title="Remove creator filter"
                aria-label="Remove creator filter"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          {phoneFilter && (
            <div className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm">
              <Phone className="w-3 h-3" />
              Phone: {phoneFilter}
              <button
                onClick={() => setPhoneFilter('')}
                className="ml-1 text-purple-600 hover:text-purple-800 dark:text-purple-300 dark:hover:text-purple-100"
                title="Remove phone filter"
                aria-label="Remove phone filter"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          {(birthdayFromFilter || birthdayToFilter) && (
            <div className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded-full text-sm">
              <Calendar className="w-3 h-3" />
              Birthday: {birthdayFromFilter || '∞'} - {birthdayToFilter || '∞'}
              <button
                onClick={() => {
                  setBirthdayFromFilter('');
                  setBirthdayToFilter('');
                }}
                className="ml-1 text-orange-600 hover:text-orange-800 dark:text-orange-300 dark:hover:text-orange-100"
                title="Remove birthday filter"
                aria-label="Remove birthday range filter"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          <button
            onClick={clearAllFilters}
            className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-800 dark:text-red-200 rounded-full text-sm transition"
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* Results Count */}
      <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        Showing {filteredContacts.length} of {contacts.length} contacts
        {hasActiveFilters && ` (filtered)`}
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
                Created By {sortField === 'ownerName' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-black dark:text-white uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-300 dark:divide-gray-700">
            {sortedContacts.map((contact) => {
              const canEdit = userRole === 'superadmin' || userRole === 'admin';
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
            <h3 className="text-base sm:text-lg font-semibold text-black dark:text-white mb-3 sm:mb-4">
              Download Contact VCF
            </h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
              You are about to download the contact information for{' '}
              <span className="font-medium text-black dark:text-white break-words">
                {selectedContact.firstName} {selectedContact.lastName}
              </span>
              . Would you like to proceed with the download or send a request to the administrator for approval?
            </p>
            
            <div className="flex flex-col gap-2 sm:gap-3">
              <button
                onClick={handleConfirmDownload}
                className="w-full px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base rounded-lg transition border border-blue-500"
              >
                Download Now
              </button>
              <button
                onClick={handleSendRequest}
                className="w-full px-3 sm:px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm sm:text-base rounded-lg transition border border-yellow-500"
              >
                Send Request to Admin
              </button>
              <button
                onClick={handleCancelDownload}
                className="w-full px-3 sm:px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm sm:text-base rounded-lg transition border border-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
