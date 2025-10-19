import React from 'react';
import { Users, TrendingUp, Eye, EyeOff } from 'lucide-react';
import { UserRole, Contact } from '../types';
import { BirthdayBox } from './BirthdayBox';

interface HeroSectionProps {
  userRole: UserRole;
  personalContactCount: number;
  collaborativeContactCount: number;
  contacts: Contact[];
  currentUserId: string;
  isDashboardHidden: boolean;
  onToggleDashboard: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ 
  userRole, 
  personalContactCount, 
  collaborativeContactCount, 
  contacts, 
  currentUserId,
  isDashboardHidden,
  onToggleDashboard
}) => {
  const getRoleMessage = () => {
    switch (userRole) {
      case 'superadmin':
        return 'Full system access - Manage all contacts and users';
      case 'admin':
        return 'Limited administrative access - View and manage contacts';
      default:
        return 'Manage your personal and collaborative contacts';
    }
  };

  return (
    <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 dark:from-blue-50 dark:via-blue-100 dark:to-blue-200 text-black overflow-hidden border-b border-blue-800 dark:border-blue-300">
      {/* Subtle dot pattern overlay */}
      <div className="absolute inset-0 opacity-10 dark:opacity-20">
        <svg width="60" height="60" viewBox="0 0 60 60" className="absolute inset-0 w-full h-full">
          <defs>
            <pattern id="dots" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <circle cx="30" cy="30" r="1.5" fill="currentColor" />
              <circle cx="10" cy="10" r="1" fill="currentColor" opacity="0.5" />
              <circle cx="50" cy="10" r="1" fill="currentColor" opacity="0.5" />
              <circle cx="10" cy="50" r="1" fill="currentColor" opacity="0.5" />
              <circle cx="50" cy="50" r="1" fill="currentColor" opacity="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>
      
      {/* Subtle geometric shapes */}
      <div className="absolute inset-0 opacity-5 dark:opacity-15">
        <div className="absolute top-10 left-10 w-20 h-20 border border-current rounded-full"></div>
        <div className="absolute top-20 right-20 w-16 h-16 border border-current transform rotate-45"></div>
        <div className="absolute bottom-20 left-20 w-12 h-12 border border-current rounded-full"></div>
        <div className="absolute bottom-10 right-10 w-24 h-24 border border-current transform rotate-12"></div>
      </div>
      
      {/* Toggle Dashboard Button - Fully Responsive Design */}
      <div className="
        absolute top-3 right-3 sm:top-4 sm:right-4 md:top-5 md:right-5 lg:top-6 lg:right-6 xl:top-8 xl:right-8
        z-20
        /* Ensure visibility on all screen sizes */
        max-w-[calc(100vw-24px)] sm:max-w-none
      ">
        <button
          onClick={onToggleDashboard}
          className="
            flex items-center justify-center gap-1 sm:gap-2 
            px-2 py-2 sm:px-3 sm:py-2 md:px-4 md:py-2.5 lg:px-4 lg:py-3
            bg-white bg-opacity-15 hover:bg-opacity-25 active:bg-opacity-35
            dark:bg-black dark:bg-opacity-15 dark:hover:bg-opacity-25 dark:active:bg-opacity-35
            text-white dark:text-black 
            rounded-lg sm:rounded-lg md:rounded-xl
            transition-all duration-200 ease-in-out
            border border-white border-opacity-20 dark:border-black dark:border-opacity-20
            hover:border-opacity-40 dark:hover:border-opacity-40
            backdrop-blur-sm
            text-xs sm:text-sm md:text-base
            shadow-lg hover:shadow-xl
            transform hover:scale-105 active:scale-95
            /* Touch-friendly minimum sizes */
            min-h-[44px] sm:min-h-[48px] md:min-h-[52px] lg:min-h-[56px]
            min-w-[44px] sm:min-w-[48px] md:min-w-auto
            /* Enhanced focus states */
            focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-60 dark:focus:ring-black
            focus:ring-offset-2 focus:ring-offset-transparent
            /* Touch device optimizations */
            touch-manipulation
            /* Prevent text selection on mobile */
            select-none
          "
          title="Hide Hero Section"
        >
          <EyeOff className="w-4 h-4 sm:w-5 sm:h-5 md:w-5 md:h-5 flex-shrink-0" />
          <span className="hidden sm:inline md:inline-block font-medium whitespace-nowrap">
            Hide
          </span>
          
          {/* Mobile-only tooltip text */}
          <span className="sr-only sm:not-sr-only hidden">
            Hide Hero Section
          </span>
        </button>
        
        {/* Mobile floating tooltip (optional) */}
        <div className="
          sm:hidden absolute -bottom-8 right-0 
          bg-black bg-opacity-75 text-white text-xs 
          px-2 py-1 rounded whitespace-nowrap
          opacity-0 pointer-events-none transition-opacity
          peer-hover:opacity-100 peer-focus:opacity-100
        ">
          Hide Hero Section
        </div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-12 lg:py-16">
        <div className="text-center mb-6 sm:mb-8 lg:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2 sm:mb-4 text-white dark:text-black">
            Contact Dashboard
          </h2>
          <p className="text-sm sm:text-lg lg:text-xl text-blue-100 dark:text-blue-800 mb-4 sm:mb-6 lg:mb-8 font-medium">{getRoleMessage()}</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          <div className="bg-white bg-opacity-20 dark:bg-white dark:bg-opacity-80 backdrop-blur-sm rounded-lg sm:rounded-xl p-4 sm:p-6 border border-white border-opacity-30 dark:border-blue-300 hover:bg-opacity-25 dark:hover:bg-opacity-90 transition-all">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-white dark:text-blue-700" />
              <span className="text-2xl sm:text-3xl font-bold text-white dark:text-black">{personalContactCount}</span>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-white dark:text-black">My Contacts</h3>
            <p className="text-blue-100 dark:text-blue-700 text-xs sm:text-sm font-medium">Personal contact list</p>
          </div>
          
          <div className="bg-white bg-opacity-20 dark:bg-white dark:bg-opacity-80 backdrop-blur-sm rounded-lg sm:rounded-xl p-4 sm:p-6 border border-white border-opacity-30 dark:border-blue-300 hover:bg-opacity-25 dark:hover:bg-opacity-90 transition-all">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-white dark:text-blue-700" />
              <span className="text-2xl sm:text-3xl font-bold text-white dark:text-black">{collaborativeContactCount}</span>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-white dark:text-black">Collaborative</h3>
            <p className="text-blue-100 dark:text-blue-700 text-xs sm:text-sm font-medium">Shared across team</p>
          </div>
          
          <div className="bg-white bg-opacity-20 dark:bg-white dark:bg-opacity-80 backdrop-blur-sm rounded-lg sm:rounded-xl p-4 sm:p-6 border border-white border-opacity-30 dark:border-blue-300 hover:bg-opacity-25 dark:hover:bg-opacity-90 transition-all">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-white dark:text-blue-700" />
              <span className="text-2xl sm:text-3xl font-bold text-white dark:text-black">{collaborativeContactCount + personalContactCount}</span>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-white dark:text-black">Total Access</h3>
            <p className="text-blue-100 dark:text-blue-700 text-xs sm:text-sm font-medium">All available contacts</p>
          </div>
        </div>
        
        {/* Birthday Box Section */}
        <div className="mt-6 sm:mt-8 lg:mt-12">
          <BirthdayBox 
            contacts={contacts} 
            currentUserId={currentUserId} 
          />
        </div>
      </div>
    </div>
  );
};
