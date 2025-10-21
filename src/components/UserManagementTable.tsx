import React, { useState } from 'react';
import { Search, Edit2, Trash2, Plus } from 'lucide-react';
import { User, UserRole } from '../types';
import { AddUserModal } from './AddUserModal';

interface UserManagementTableProps {
  users: User[];
  currentUserId: string;
  currentUserRole: UserRole;
  onEdit: (user: User) => void;
  onDelete: (id: string) => void;
  onAdd: (userData: Omit<User, 'id'>) => void;
}



export const UserManagementTable: React.FC<UserManagementTableProps> = ({ 
  users, 
  currentUserId, 
  currentUserRole, 
  onEdit, 
  onDelete, 
  onAdd 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof User>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const filteredUsers = users.filter(user =>
    Object.values(user).some(value =>
      value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field: keyof User) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleAddUser = (userData: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    employeeNumber: string;
    position: string;
    username: string;
  }) => {
    const newUser: Omit<User, 'id'> = {
      name: userData.name,
      email: userData.email,
      username: userData.username,
      password: userData.password,
      role: userData.role,
      position: userData.position,
      employeeNumber: userData.employeeNumber
    };
    onAdd(newUser);
    setSuccessMessage(`✅ User "${userData.name}" has been successfully added to the Supabase database!`);
    setTimeout(() => setSuccessMessage(''), 5000);
    setShowAddModal(false);
  };

  const canManageUsers = currentUserRole === 'admin' || currentUserRole === 'superadmin';

  if (!canManageUsers) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400">
          You don't have permission to manage users.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-400 dark:border-gray-600 rounded-lg bg-white dark:bg-black text-black dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white transition-colors"
          />
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition border border-blue-500 shadow-lg hover:shadow-xl"
        >
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
              <Plus className="w-3 h-3 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-green-800 dark:text-green-200 font-medium">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      <AddUserModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddUser}
      />

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-200 dark:bg-gray-800">
            <tr>
              <th onClick={() => handleSort('name')} className="px-4 py-3 text-left text-xs font-semibold text-black dark:text-white uppercase cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">
                Name {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('username')} className="px-4 py-3 text-left text-xs font-semibold text-black dark:text-white uppercase cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">
                Username {sortField === 'username' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('email')} className="px-4 py-3 text-left text-xs font-semibold text-black dark:text-white uppercase cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">
                Email {sortField === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('employeeNumber')} className="px-4 py-3 text-left text-xs font-semibold text-black dark:text-white uppercase cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">
                Employee Number {sortField === 'employeeNumber' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('position')} className="px-4 py-3 text-left text-xs font-semibold text-black dark:text-white uppercase cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">
                Position {sortField === 'position' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('role')} className="px-4 py-3 text-left text-xs font-semibold text-black dark:text-white uppercase cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">
                Role {sortField === 'role' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-black dark:text-white uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-300 dark:divide-gray-700">
            {sortedUsers.map((user) => {
              const canEdit = currentUserRole === 'superadmin';
              const canDelete = currentUserRole === 'superadmin' && user.id !== currentUserId;
              
              return (
                <tr key={user.id} className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <td className="px-4 py-3 text-sm text-black dark:text-white">{user.name}</td>
                  <td className="px-4 py-3 text-sm text-black dark:text-white">{user.username}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{user.email}</td>
                  <td className="px-4 py-3 text-sm text-black dark:text-white">{user.employeeNumber}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{user.position}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.role === 'superadmin' 
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
                        : user.role === 'admin'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex gap-2">
                      {canEdit && (
                        <button onClick={() => onEdit(user)} title="Edit user" className="text-black dark:text-white hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      {canDelete && (
                        <button onClick={() => onDelete(user.id)} title="Delete user" className="text-red-600 hover:text-red-700 transition-colors">
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
        Showing {sortedUsers.length} of {users.length} users
      </div>
    </div>
  );
};