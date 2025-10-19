import React from 'react';
import { User, Users, Settings, Activity } from 'lucide-react';

interface TabNavigationProps {
  activeTab: 'personal' | 'collaborative' | 'users' | 'changelog';
  onTabChange: (tab: 'personal' | 'collaborative' | 'users' | 'changelog') => void;
  userRole: 'user' | 'admin' | 'superadmin';
}

export const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange, userRole }) => {
  const canManageUsers = userRole === 'admin' || userRole === 'superadmin';

  return (
    <div className="bg-white dark:bg-black shadow-sm border-b border-gray-300 dark:border-gray-700 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex gap-0 sm:gap-1 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => onTabChange('personal')}
            className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-3 sm:py-4 font-semibold transition-all whitespace-nowrap text-sm sm:text-base ${
              activeTab === 'personal'
                ? 'text-black dark:text-white border-b-2 border-black dark:border-white'
                : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
            }`}
          >
            <User className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">My Contacts</span>
            <span className="sm:hidden">Personal</span>
          </button>
          
          <button
            onClick={() => onTabChange('collaborative')}
            className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-3 sm:py-4 font-semibold transition-all whitespace-nowrap text-sm sm:text-base ${
              activeTab === 'collaborative'
                ? 'text-black dark:text-white border-b-2 border-black dark:border-white'
                : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Collaborative Contacts</span>
            <span className="sm:hidden">Collaborative</span>
          </button>

          {canManageUsers && (
            <>
              <button
                onClick={() => onTabChange('users')}
                className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-3 sm:py-4 font-semibold transition-all whitespace-nowrap text-sm sm:text-base ${
                  activeTab === 'users'
                    ? 'text-black dark:text-white border-b-2 border-black dark:border-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
                }`}
              >
                <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">User Management</span>
                <span className="sm:hidden">Users</span>
              </button>
              
              <button
                onClick={() => onTabChange('changelog')}
                className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-3 sm:py-4 font-semibold transition-all whitespace-nowrap text-sm sm:text-base ${
                  activeTab === 'changelog'
                    ? 'text-black dark:text-white border-b-2 border-black dark:border-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
                }`}
              >
                <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Changelog</span>
                <span className="sm:hidden">Changelog</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
