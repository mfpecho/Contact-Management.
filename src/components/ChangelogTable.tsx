import React, { useState, useEffect, useRef } from 'react';
import { Search, Clock, User, Activity, Download, FileText, Filter, ChevronDown } from 'lucide-react';
import { ChangelogEntry, ChangelogAction, ChangelogEntity } from '../types';

interface ChangelogTableProps {
  entries: ChangelogEntry[];
}

export const ChangelogTable: React.FC<ChangelogTableProps> = ({ entries }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof ChangelogEntry>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterAction, setFilterAction] = useState<ChangelogAction | 'all'>('all');
  const [filterEntity, setFilterEntity] = useState<ChangelogEntity | 'all'>('all');
  const [showDetails, setShowDetails] = useState(true);
  
  // Advanced filter dropdown state
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Advanced filter states
  const [timeFilter, setTimeFilter] = useState<'all' | 'week' | 'month' | 'year'>('all');
  const [userFilter, setUserFilter] = useState('');
  const [descriptionFilter, setDescriptionFilter] = useState('');
  const [detailsFilter, setDetailsFilter] = useState('');
  
  // Checkbox selection states
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  // Clear all filters function
  const clearAllFilters = () => {
    setSearchTerm('');
    setFilterAction('all');
    setFilterEntity('all');
    setTimeFilter('all');
    setUserFilter('');
    setDescriptionFilter('');
    setDetailsFilter('');
    setShowDetails(true);
  };

  // Checkbox selection functions
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedEntries(new Set());
      setSelectAll(false);
    } else {
      const allIds = new Set(sortedEntries.map(entry => entry.id));
      setSelectedEntries(allIds);
      setSelectAll(true);
    }
  };

  const handleSelectEntry = (entryId: string) => {
    const newSelected = new Set(selectedEntries);
    if (newSelected.has(entryId)) {
      newSelected.delete(entryId);
    } else {
      newSelected.add(entryId);
    }
    setSelectedEntries(newSelected);
    setSelectAll(newSelected.size === sortedEntries.length);
  };

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = Object.values(entry).some(value =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesAction = filterAction === 'all' || entry.action === filterAction;
    const matchesEntity = filterEntity === 'all' || entry.entity === filterEntity;
    
    // Time-based filtering
    let matchesTime = true;
    if (timeFilter !== 'all') {
      const entryDate = new Date(entry.timestamp);
      const now = new Date();
      
      switch (timeFilter) {
        case 'week': {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesTime = entryDate >= weekAgo;
          break;
        }
        case 'month': {
          const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          matchesTime = entryDate >= monthAgo;
          break;
        }
        case 'year': {
          const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          matchesTime = entryDate >= yearAgo;
          break;
        }
      }
    }
    
    // Additional field filters
    const matchesUser = !userFilter || 
      entry.userName?.toLowerCase().includes(userFilter.toLowerCase()) ||
      entry.userRole?.toLowerCase().includes(userFilter.toLowerCase());
    
    const matchesDescription = !descriptionFilter || 
      entry.description.toLowerCase().includes(descriptionFilter.toLowerCase());
    
    const matchesDetails = !detailsFilter || 
      (entry.details && entry.details.toLowerCase().includes(detailsFilter.toLowerCase()));
    
    return matchesSearch && matchesAction && matchesEntity && matchesTime && 
           matchesUser && matchesDescription && matchesDetails;
  });

  const sortedEntries = [...filteredEntries].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Update selectAll state when filtered entries change
  useEffect(() => {
    if (sortedEntries.length === 0) {
      setSelectAll(false);
    } else {
      setSelectAll(selectedEntries.size === sortedEntries.length && sortedEntries.every(entry => selectedEntries.has(entry.id)));
    }
  }, [sortedEntries, selectedEntries]);

  const handleSort = (field: keyof ChangelogEntry) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getActionIcon = (action: ChangelogAction) => {
    switch (action) {
      case 'create': return '➕';
      case 'update': return '✏️';
      case 'delete': return '🗑️';
      case 'login': return '🔑';
      case 'logout': return '🚪';
      case 'export': return '📤';
      case 'download': return '⬇️';
      default: return '📝';
    }
  };

  const getActionColor = (action: ChangelogAction) => {
    switch (action) {
      case 'create': return 'text-green-600 dark:text-green-400';
      case 'update': return 'text-blue-600 dark:text-blue-400';
      case 'delete': return 'text-red-600 dark:text-red-400';
      case 'login': return 'text-purple-600 dark:text-purple-400';
      case 'logout': return 'text-orange-600 dark:text-orange-400';
      case 'export': return 'text-indigo-600 dark:text-indigo-400';
      case 'download': return 'text-cyan-600 dark:text-cyan-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'superadmin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'admin': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'user': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const exportChangelog = () => {
    const entriesToExport = selectedEntries.size > 0 
      ? sortedEntries.filter(entry => selectedEntries.has(entry.id))
      : sortedEntries;
    
    const activeFilters = [];
    if (searchTerm) activeFilters.push(`Search: "${searchTerm}"`);
    if (filterAction !== 'all') activeFilters.push(`Action: ${filterAction}`);
    if (filterEntity !== 'all') activeFilters.push(`Entity: ${filterEntity}`);
    if (timeFilter !== 'all') activeFilters.push(`Time: ${timeFilter}`);
    if (userFilter) activeFilters.push(`User: "${userFilter}"`);
    if (descriptionFilter) activeFilters.push(`Description: "${descriptionFilter}"`);
    if (detailsFilter) activeFilters.push(`Details: "${detailsFilter}"`);
    
    const exportType = selectedEntries.size > 0 ? `Selected ${selectedEntries.size} entries` : 'All filtered entries';
    const filterSummary = `Export Type: ${exportType}\n` +
      (activeFilters.length > 0 
        ? `Filters Applied: ${activeFilters.join(', ')}\nTotal Exported Records: ${entriesToExport.length} of ${entries.length}\n\n`
        : `Total Records: ${entriesToExport.length}\n\n`);

    const csvContent = [
      ['Timestamp', 'User ID', 'User Name', 'User Role', 'Action', 'Entity Type', 'Entity ID', 'Entity Name', 'Description', 'Details'],
      ...entriesToExport.map(entry => [
        new Date(entry.timestamp).toLocaleString(),
        entry.userId,
        entry.userName,
        entry.userRole,
        entry.action,
        entry.entity,
        entry.entityId || '',
        entry.entityName || '',
        entry.description,
        entry.details || ''
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const fullContent = filterSummary + csvContent;
    const blob = new Blob([fullContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().split('T')[0];
    const selectionLabel = selectedEntries.size > 0 ? '-selected' : '';
    const filterLabel = activeFilters.length > 0 ? '-filtered' : '';
    link.download = `changelog${selectionLabel}${filterLabel}-${timestamp}.csv`;
    link.click();
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-xl shadow-lg p-6 transition-colors border border-gray-200 dark:border-gray-800">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-black dark:text-white">System Changelog</h2>
        </div>
        
        <button
          onClick={exportChangelog}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition border border-blue-500"
          title={selectedEntries.size > 0 ? `Export ${selectedEntries.size} selected entries` : 'Export all filtered entries'}
        >
          <Download className="w-4 h-4" />
          {selectedEntries.size > 0 ? `Export Selected (${selectedEntries.size})` : 'Export Changelog'}
        </button>
      </div>

      {/* Filter Status */}
      {(searchTerm || filterAction !== 'all' || filterEntity !== 'all' || timeFilter !== 'all' || userFilter || descriptionFilter || detailsFilter) && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-blue-800 dark:text-blue-200 font-medium">Active Filters:</span>
            {searchTerm && (
              <span className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                Search: "{searchTerm}"
              </span>
            )}
            {filterAction !== 'all' && (
              <span className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                Action: {filterAction}
              </span>
            )}
            {filterEntity !== 'all' && (
              <span className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                Entity: {filterEntity}
              </span>
            )}
            {timeFilter !== 'all' && (
              <span className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                Time: {timeFilter}
              </span>
            )}
            {userFilter && (
              <span className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                User: "{userFilter}"
              </span>
            )}
            {descriptionFilter && (
              <span className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                Description: "{descriptionFilter}"
              </span>
            )}
            {detailsFilter && (
              <span className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                Details: "{detailsFilter}"
              </span>
            )}
            <span className="text-blue-600 dark:text-blue-400 font-medium ml-2">
              Showing {sortedEntries.length} of {entries.length} records
            </span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search changelog..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-400 dark:border-gray-600 rounded-lg bg-white dark:bg-black text-black dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white transition-colors"
            />
          </div>
          
          {/* Advanced Filter Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition border bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-300 dark:hover:bg-gray-600"
              title="Advanced Filters"
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Advanced Filters</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showDropdown && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 p-4">
                <div className="space-y-4">
                  {/* Time Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Time Period
                    </label>
                    <select
                      value={timeFilter}
                      onChange={(e) => setTimeFilter(e.target.value as 'all' | 'week' | 'month' | 'year')}
                      title="Select time period filter"
                      className="w-full px-3 py-2 border border-gray-400 dark:border-gray-600 rounded-lg bg-white dark:bg-black text-black dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white"
                    >
                      <option value="all">All Time</option>
                      <option value="week">Past Week</option>
                      <option value="month">Past Month</option>
                      <option value="year">Past Year</option>
                    </select>
                  </div>
                  
                  {/* User Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      User (Name or Role)
                    </label>
                    <input
                      type="text"
                      value={userFilter}
                      onChange={(e) => setUserFilter(e.target.value)}
                      placeholder="Filter by user name or role..."
                      className="w-full px-3 py-2 border border-gray-400 dark:border-gray-600 rounded-lg bg-white dark:bg-black text-black dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white"
                    />
                  </div>
                  
                  {/* Description Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <input
                      type="text"
                      value={descriptionFilter}
                      onChange={(e) => setDescriptionFilter(e.target.value)}
                      placeholder="Filter by description..."
                      className="w-full px-3 py-2 border border-gray-400 dark:border-gray-600 rounded-lg bg-white dark:bg-black text-black dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white"
                    />
                  </div>
                  
                  {/* Details Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Details
                    </label>
                    <input
                      type="text"
                      value={detailsFilter}
                      onChange={(e) => setDetailsFilter(e.target.value)}
                      placeholder="Filter by details..."
                      className="w-full px-3 py-2 border border-gray-400 dark:border-gray-600 rounded-lg bg-white dark:bg-black text-black dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white"
                    />
                  </div>
                  
                  {/* Show Details Toggle */}
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Show Details Column
                    </label>
                    <button
                      onClick={() => setShowDetails(!showDetails)}
                      className={`px-3 py-1 rounded text-sm transition ${
                        showDetails
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      {showDetails ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  
                  {/* Clear All Filters */}
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                    <button
                      onClick={clearAllFilters}
                      className="w-full px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                    >
                      Clear All Filters
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value as ChangelogAction | 'all')}
          title="Filter by action type"
          className="px-3 py-2 border border-gray-400 dark:border-gray-600 rounded-lg bg-white dark:bg-black text-black dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white"
        >
          <option value="all">All Actions</option>
          <option value="create">Create</option>
          <option value="update">Update</option>
          <option value="delete">Delete</option>
          <option value="login">Login</option>
          <option value="logout">Logout</option>
          <option value="export">Export</option>
          <option value="download">Download</option>
        </select>
        
        <select
          value={filterEntity}
          onChange={(e) => setFilterEntity(e.target.value as ChangelogEntity | 'all')}
          title="Filter by entity type"
          className="px-3 py-2 border border-gray-400 dark:border-gray-600 rounded-lg bg-white dark:bg-black text-black dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white"
        >
          <option value="all">All Entities</option>
          <option value="contact">Contact</option>
          <option value="user">User</option>
          <option value="system">System</option>
        </select>
      </div>

      {/* Stats */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing {sortedEntries.length} of {entries.length} changelog entries
        </div>
        
        {selectedEntries.size > 0 && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
              {selectedEntries.size} selected
            </span>
            <button
              onClick={() => {
                setSelectedEntries(new Set());
                setSelectAll(false);
              }}
              className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
            >
              Clear Selection
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-200 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-black dark:text-white uppercase">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  title="Select all entries"
                />
              </th>
              <th onClick={() => handleSort('timestamp')} className="px-4 py-3 text-left text-xs font-semibold text-black dark:text-white uppercase cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Timestamp {sortField === 'timestamp' && (sortOrder === 'asc' ? '↑' : '↓')}
                </div>
              </th>
              <th onClick={() => handleSort('userName')} className="px-4 py-3 text-left text-xs font-semibold text-black dark:text-white uppercase cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  User {sortField === 'userName' && (sortOrder === 'asc' ? '↑' : '↓')}
                </div>
              </th>
              <th onClick={() => handleSort('action')} className="px-4 py-3 text-left text-xs font-semibold text-black dark:text-white uppercase cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">
                Action {sortField === 'action' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('entity')} className="px-4 py-3 text-left text-xs font-semibold text-black dark:text-white uppercase cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">
                Entity {sortField === 'entity' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-black dark:text-white uppercase">
                Description
              </th>
              {showDetails && (
                <th className="px-4 py-3 text-left text-xs font-semibold text-black dark:text-white uppercase">
                  Details
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-300 dark:divide-gray-700">
            {sortedEntries.map((entry) => (
              <tr key={entry.id} className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <td className="px-4 py-3 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedEntries.has(entry.id)}
                    onChange={() => handleSelectEntry(entry.id)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    title={`Select entry from ${new Date(entry.timestamp).toLocaleString()}`}
                  />
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                  {new Date(entry.timestamp).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex flex-col">
                    <span className="text-black dark:text-white font-medium">{entry.userName}</span>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(entry.userRole)}`}>
                      {entry.userRole}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className={`flex items-center gap-2 ${getActionColor(entry.action)}`}>
                    <span>{getActionIcon(entry.action)}</span>
                    <span className="capitalize font-medium">{entry.action}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className="capitalize text-black dark:text-white font-medium">{entry.entity}</span>
                  {entry.entityName && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">{entry.entityName}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-black dark:text-white">
                  {entry.description}
                </td>
                {showDetails && (
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {entry.details && (
                      <div className="max-w-xs truncate" title={entry.details}>
                        {entry.details}
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sortedEntries.length === 0 && (
        <div className="text-center py-8">
          <Activity className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm || filterAction !== 'all' || filterEntity !== 'all' 
              ? 'No changelog entries found matching your filters.' 
              : 'No changelog entries available.'}
          </p>
        </div>
      )}
    </div>
  );
};