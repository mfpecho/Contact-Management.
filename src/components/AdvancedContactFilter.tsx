import React, { useState, useRef, useEffect } from 'react';
import { Filter, X, ChevronDown, Calendar, Building, User, Phone } from 'lucide-react';
import { Contact, UserRole } from '../types';
import { ContactFilters } from '../utils/contactFilters';

interface AdvancedContactFilterProps {
  contacts: Contact[];
  userRole: UserRole;
  onFilterChange: (filters: ContactFilters) => void;
  className?: string;
}

export const AdvancedContactFilter: React.FC<AdvancedContactFilterProps> = ({
  contacts,
  userRole,
  onFilterChange,
  className = ""
}) => {
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [filters, setFilters] = useState<ContactFilters>({
    search: '',
    company: '',
    owner: '',
    phone: '',
    birthdayFrom: '',
    birthdayTo: ''
  });
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

  // Update active filters indicator and notify parent
  useEffect(() => {
    const hasFilters = filters.company || filters.owner || filters.phone || filters.birthdayFrom || filters.birthdayTo || filters.search;
    setHasActiveFilters(!!hasFilters);
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  // Get unique values for filter options
  const uniqueCompanies = [...new Set(contacts.map(c => c.company).filter(Boolean))].sort();
  const uniqueOwners = [...new Set(contacts.map(c => c.ownerName).filter(Boolean))].sort();

  const updateFilter = (key: keyof ContactFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearAllFilters = () => {
    const emptyFilters: ContactFilters = {
      search: '',
      company: '',
      owner: '',
      phone: '',
      birthdayFrom: '',
      birthdayTo: ''
    };
    setFilters(emptyFilters);
  };

  return (
    <div className={`relative ${className}`} ref={filterDropdownRef}>
      <button
        onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition border ${
          hasActiveFilters 
            ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500' 
            : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 border-gray-400 dark:border-gray-600'
        }`}
        aria-label="Open advanced filters"
      >
        <Filter className="w-4 h-4" />
        Filter
        <ChevronDown className="w-4 h-4" />
        {hasActiveFilters && (
          <span className="ml-1 px-2 py-1 bg-white bg-opacity-20 rounded-full text-xs">
            Active
          </span>
        )}
      </button>

      {/* Advanced Filter Dropdown */}
      {showAdvancedFilter && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-10">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Advanced Filters</h3>
              <button
                onClick={() => setShowAdvancedFilter(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                aria-label="Close advanced filters"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Search Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Search All Fields
                </label>
                <input
                  type="text"
                  placeholder="Search names, company, phone..."
                  value={filters.search}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Company Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Building className="w-4 h-4 inline mr-2" />
                  Company
                </label>
                <select
                  value={filters.company}
                  onChange={(e) => updateFilter('company', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  aria-label="Filter by company"
                >
                  <option value="">All Companies</option>
                  {uniqueCompanies.map(company => (
                    <option key={company} value={company}>{company}</option>
                  ))}
                </select>
              </div>

              {/* Owner Filter */}
              {/* cspell:ignore superadmin */}
              {(userRole === 'admin' || userRole === 'superadmin') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Creator
                  </label>
                  <select
                    value={filters.owner}
                    onChange={(e) => updateFilter('owner', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    aria-label="Filter by creator"
                  >
                    <option value="">All Creators</option>
                    {uniqueOwners.map(owner => (
                      <option key={owner} value={owner}>{owner}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Phone Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="Search phone numbers..."
                  value={filters.phone}
                  onChange={(e) => updateFilter('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Birthday Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Birthday Range
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    placeholder="From"
                    value={filters.birthdayFrom}
                    onChange={(e) => updateFilter('birthdayFrom', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    aria-label="Birthday from date"
                  />
                  <input
                    type="date"
                    placeholder="To"
                    value={filters.birthdayTo}
                    onChange={(e) => updateFilter('birthdayTo', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    aria-label="Birthday to date"
                  />
                </div>
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Clear All
              </button>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Filters applied
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="absolute top-full mt-2 left-0 right-0 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700 z-5">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Active Filters:</span>
              {filters.search && (
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-full text-xs">
                  Search: {filters.search}
                </span>
              )}
              {filters.company && (
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-full text-xs">
                  Company: {filters.company}
                </span>
              )}
              {filters.owner && (
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-full text-xs">
                  Created by: {filters.owner}
                </span>
              )}
              {filters.phone && (
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-full text-xs">
                  Phone: {filters.phone}
                </span>
              )}
              {(filters.birthdayFrom || filters.birthdayTo) && (
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-full text-xs">
                  Birthday: {filters.birthdayFrom || '...'} to {filters.birthdayTo || '...'}
                </span>
              )}
            </div>
            <button
              onClick={clearAllFilters}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 text-sm"
            >
              Clear All
            </button>
          </div>
        </div>
      )}
    </div>
  );
};