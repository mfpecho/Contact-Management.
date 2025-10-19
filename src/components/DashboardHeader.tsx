import React, { useState, useEffect, useRef } from 'react';
import { LogOut, Users, UserCog, Shield, Moon, Sun, Bell, Download } from 'lucide-react';
import { User, Contact, VCFDownloadRequest } from '../types';
import { useTheme } from './theme-provider';

interface DashboardHeaderProps {
  user: User;
  contacts: Contact[];
  vcfRequests: VCFDownloadRequest[];
  onLogout: () => void;
  onApproveVCFRequest?: (requestId: string) => void;
  onDenyVCFRequest?: (requestId: string) => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ 
  user, 
  contacts, 
  vcfRequests, 
  onLogout, 
  onApproveVCFRequest, 
  onDenyVCFRequest 
}) => {
  const { theme, setTheme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<Contact[]>([]);
  const [collaborativeBirthdays, setCollaborativeBirthdays] = useState<Contact[]>([]);
  const [pendingVCFRequests, setPendingVCFRequests] = useState<VCFDownloadRequest[]>([]);
  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    onLogout();
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  // Close user menu and notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close logout confirmation with Escape key
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showLogoutConfirm) setShowLogoutConfirm(false);
        if (showUserMenu) setShowUserMenu(false);
        if (showNotifications) setShowNotifications(false);
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [showLogoutConfirm, showUserMenu, showNotifications]);

  // Calculate upcoming birthdays (within next 30 days) and collaborative birthdays (1 month before)
  useEffect(() => {
    console.log('Calculating birthdays for contacts:', contacts.length, 'contacts loaded from database');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    // Regular upcoming birthdays (next 30 days) - all contacts from database
    const upcoming = contacts.filter(contact => {
      if (!contact.birthday) {
        console.warn('Contact missing birthday:', contact.firstName, contact.lastName);
        return false;
      }
      
      const birthDate = new Date(contact.birthday);
      const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
      
      // If birthday already passed this year, check next year
      if (thisYearBirthday < today) {
        thisYearBirthday.setFullYear(today.getFullYear() + 1);
      }

      const isWithinNext30Days = thisYearBirthday >= today && thisYearBirthday <= thirtyDaysFromNow;
      
      if (isWithinNext30Days) {
        const daysUntil = Math.ceil((thisYearBirthday.getTime() - today.getTime()) / (1000 * 3600 * 24));
        console.log(`Upcoming birthday: ${contact.firstName} ${contact.lastName} in ${daysUntil} days (${contact.birthday})`);
      }
      
      return isWithinNext30Days;
    }).sort((a, b) => {
      const aDate = new Date(a.birthday);
      const bDate = new Date(b.birthday);
      const thisYear = today.getFullYear();
      
      const aBirthday = new Date(thisYear, aDate.getMonth(), aDate.getDate());
      const bBirthday = new Date(thisYear, bDate.getMonth(), bDate.getDate());
      
      if (aBirthday < today) aBirthday.setFullYear(thisYear + 1);
      if (bBirthday < today) bBirthday.setFullYear(thisYear + 1);
      
      return aBirthday.getTime() - bBirthday.getTime();
    });

    // Collaborative birthdays (1 month before) - only contacts from other users
    const oneMonthFromNow = new Date(today);
    oneMonthFromNow.setDate(today.getDate() + 30);
    const twoMonthsFromNow = new Date(today);
    twoMonthsFromNow.setDate(today.getDate() + 60);

    const collaborative = contacts
      .filter(contact => contact.ownerId !== user.id) // Only collaborative contacts (not owned by current user)
      .filter(contact => {
        if (!contact.birthday) return false;
        
        const birthDate = new Date(contact.birthday);
        const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
        
        // If birthday already passed this year, check next year
        if (thisYearBirthday < today) {
          thisYearBirthday.setFullYear(today.getFullYear() + 1);
        }

        // Check if birthday is between 30-60 days from today (1 month advance notice)
        const isCollaborativeNotice = thisYearBirthday > oneMonthFromNow && thisYearBirthday <= twoMonthsFromNow;
        
        if (isCollaborativeNotice) {
          const daysUntil = Math.ceil((thisYearBirthday.getTime() - today.getTime()) / (1000 * 3600 * 24));
          console.log(`Collaborative birthday: ${contact.firstName} ${contact.lastName} (Owner: ${contact.ownerName}) in ${daysUntil} days`);
        }
        
        return isCollaborativeNotice;
      })
      .sort((a, b) => {
        const aDate = new Date(a.birthday);
        const bDate = new Date(b.birthday);
        const thisYear = today.getFullYear();
        
        const aBirthday = new Date(thisYear, aDate.getMonth(), aDate.getDate());
        const bBirthday = new Date(thisYear, bDate.getMonth(), bDate.getDate());
        
        if (aBirthday < today) aBirthday.setFullYear(thisYear + 1);
        if (bBirthday < today) bBirthday.setFullYear(thisYear + 1);
        
        return aBirthday.getTime() - bBirthday.getTime();
      });

    console.log(`Birthday notifications summary:
      - Total contacts checked: ${contacts.length}
      - Upcoming birthdays (next 30 days): ${upcoming.length}
      - Collaborative birthdays (30-60 days): ${collaborative.length}`);

    setUpcomingBirthdays(upcoming);
    setCollaborativeBirthdays(collaborative);
  }, [contacts, user.id]);

  // Filter VCF requests for admins and superadmins
  useEffect(() => {
    if (user.role === 'admin' || user.role === 'superadmin') {
      const pending = vcfRequests.filter(request => request.status === 'pending');
      setPendingVCFRequests(pending);
    } else {
      setPendingVCFRequests([]);
    }
  }, [vcfRequests, user.role]);

  const getDaysUntilBirthday = (birthday: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
    const birthDate = new Date(birthday);
    const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
    
    if (thisYearBirthday < today) {
      thisYearBirthday.setFullYear(today.getFullYear() + 1);
    }
    
    const timeDiff = thisYearBirthday.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };

  const formatBirthdayDate = (birthday: string) => {
    const date = new Date(birthday);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  };

  const getRoleIcon = () => {
    switch (user.role) {
      case 'superadmin':
        return <Shield className="w-5 h-5 sm:w-6 sm:h-6" />;
      case 'admin':
        return <UserCog className="w-5 h-5 sm:w-6 sm:h-6" />;
      default:
        return <Users className="w-5 h-5 sm:w-6 sm:h-6" />;
    }
  };

  const getRoleBadge = () => {
    const badges = {
      user: 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 dark:from-gray-800 dark:to-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600',
      admin: 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 dark:from-yellow-900 dark:to-orange-900 dark:text-yellow-200 border border-yellow-300 dark:border-yellow-700',
      superadmin: 'bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 dark:from-blue-900 dark:to-purple-900 dark:text-blue-200 border border-blue-300 dark:border-blue-700'
    };
    
    const labels = {
      user: 'User',
      admin: 'Administrator',
      superadmin: 'Super Administrator'
    };
    
    return (
      <div className="flex items-center gap-2">
        <span className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold ${badges[user.role]} shadow-sm`}>
          {labels[user.role]}
        </span>
        {/* Real-time Status Indicator */}
        <div className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900 rounded-full">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-green-700 dark:text-green-300 font-medium">Live</span>
        </div>
      </div>
    );
  };

  const getMobileRoleIndicator = () => {
    if (user.role === 'user') return null;
    
    const colors = {
      admin: 'bg-gradient-to-r from-yellow-500 to-orange-500',
      superadmin: 'bg-gradient-to-r from-blue-500 to-purple-500'
    };
    
    return (
      <div className={`w-3 h-3 rounded-full ${colors[user.role]} absolute -top-0.5 -right-0.5 border border-white dark:border-black shadow-sm`}></div>
    );
  };

  const getHeaderTitle = () => {
    const titles = {
      user: 'APPS',
      admin: 'APPS',
      superadmin: 'APPS'
    };
    return titles[user.role];
  };

  const getWelcomeMessage = () => {
    const messages = {
      user: `Welcome back, ${user.name}`,
      admin: `Administrator Portal - ${user.name}`,
      superadmin: `Super Admin Console - ${user.name}`
    };
    return messages[user.role];
  };

  return (
    <header className="bg-white dark:bg-black shadow-md sticky top-0 z-40 transition-colors border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            <div className="relative flex-shrink-0">
              <div className={`p-2 sm:p-3 rounded-xl shadow-md transition-all duration-200 ${
                user.role === 'superadmin' 
                  ? 'bg-gradient-to-br from-blue-600 to-purple-600' 
                  : user.role === 'admin'
                    ? 'bg-gradient-to-br from-yellow-500 to-orange-500'
                    : 'bg-gradient-to-br from-gray-600 to-gray-700'
              }`}>
                <div className="text-white">
                  {getRoleIcon()}
                </div>
              </div>
              {/* Mobile role indicator dot for admin/superadmin */}
              <div className="sm:hidden">
                {getMobileRoleIndicator()}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 sm:gap-3">
                <img 
                  src="/my-logo.png" 
                  alt="Logo" 
                  className="w-20 h-16 sm:w-32 sm:h-16 object-contain flex-shrink-0"
                />
                <h1 className="text-lg sm:text-2xl font-bold text-black dark:text-white truncate">
                  {getHeaderTitle()}
                </h1>
                {/* Mobile role badge for admin/superadmin */}
                <div className="sm:hidden">
                  {(user.role === 'admin' || user.role === 'superadmin') && (
                    <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                      user.role === 'superadmin' 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' 
                        : 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                    } shadow-sm`}>
                      {user.role === 'superadmin' ? 'SA' : 'ADM'}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                {getWelcomeMessage()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
            {/* Desktop Role Badge */}
            <div className="hidden sm:block">
              {getRoleBadge()}
            </div>
            
            {/* User Menu Dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={toggleUserMenu}
                className="relative focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-black rounded-full transition-all duration-200 hover:scale-105"
                title="User menu"
              >
                <div className={`p-0.5 rounded-full transition-all duration-200 ${
                  user.role === 'superadmin' 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500' 
                    : user.role === 'admin'
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                      : 'bg-gray-400'
                } ${showUserMenu ? 'ring-2 ring-white dark:ring-black ring-offset-2 ring-offset-blue-500' : ''}`}>
                  <img src={user.avatar} alt={user.name} className="w-9 h-9 sm:w-11 sm:h-11 rounded-full object-cover bg-white dark:bg-black p-0.5" />
                </div>
                
                {/* Notification indicator */}
                {(upcomingBirthdays.length > 0 || collaborativeBirthdays.length > 0 || pendingVCFRequests.length > 0) && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-black">
                    <span className="text-white text-xs font-bold">
                      {upcomingBirthdays.length + collaborativeBirthdays.length + pendingVCFRequests.length}
                    </span>
                  </div>
                )}
                
                {/* Role icon overlay for mobile */}
                <div className="sm:hidden">
                  {user.role === 'superadmin' && (
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full border-2 border-white dark:border-black flex items-center justify-center shadow-sm">
                      <Shield className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                  {user.role === 'admin' && (
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full border-2 border-white dark:border-black flex items-center justify-center shadow-sm">
                      <UserCog className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>
              </button>
              
              {/* User Menu Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-black rounded-xl shadow-xl border border-gray-300 dark:border-gray-700 z-50 overflow-hidden">
                  {/* User Info Header */}
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <div className="flex items-center gap-3">
                      <div className={`p-0.5 rounded-full ${
                        user.role === 'superadmin' 
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500' 
                          : user.role === 'admin'
                            ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                            : 'bg-gray-400'
                      }`}>
                        <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover bg-white dark:bg-black p-0.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-black dark:text-white truncate">{user.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{user.email}</p>
                        <div className="mt-1">
                          {getRoleBadge()}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="p-2">
                    {/* Notifications Button */}
                    <button
                      onClick={toggleNotifications}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <div className="relative">
                        <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        {(upcomingBirthdays.length > 0 || collaborativeBirthdays.length > 0 || pendingVCFRequests.length > 0) && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                            {upcomingBirthdays.length + collaborativeBirthdays.length + pendingVCFRequests.length}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-black dark:text-white">Notifications</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {upcomingBirthdays.length + collaborativeBirthdays.length + pendingVCFRequests.length > 0 
                            ? `${upcomingBirthdays.length + collaborativeBirthdays.length + pendingVCFRequests.length} new notifications`
                            : 'No new notifications'
                          }
                        </p>
                      </div>
                    </button>
                    
                    {/* Theme Toggle */}
                    <button
                      onClick={toggleTheme}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <div className="w-5 h-5 flex items-center justify-center">
                        {theme === 'dark' ? (
                          <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        ) : (
                          <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-black dark:text-white">
                          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Switch to {theme === 'dark' ? 'light' : 'dark'} theme
                        </p>
                      </div>
                    </button>
                    
                    {/* Logout Button */}
                    <button
                      onClick={handleLogoutClick}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors mt-1 border-t border-gray-200 dark:border-gray-700 pt-3"
                    >
                      <LogOut className="w-5 h-5 text-red-600 dark:text-red-400" />
                      <div className="flex-1">
                        <p className="font-medium text-red-600 dark:text-red-400">Logout</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Sign out of your account</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}
              
              {/* Notifications Panel (shown when notifications is clicked) */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-black rounded-xl shadow-xl border border-gray-300 dark:border-gray-700 z-50 overflow-hidden" ref={notificationRef}>
                  {/* VCF Download Requests Section */}
                  {(user.role === 'admin' || user.role === 'superadmin') && (
                    <>
                      <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-950">
                        <div className="flex items-center gap-2">
                          <Download className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          <h3 className="font-semibold text-black dark:text-white text-sm sm:text-base">VCF Download Requests</h3>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Pending approvals</p>
                      </div>
                      
                      <div className="max-h-40 sm:max-h-48 overflow-y-auto">
                        {pendingVCFRequests.length === 0 ? (
                          <div className="p-3 sm:p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                            No pending VCF download requests
                          </div>
                        ) : (
                          pendingVCFRequests.map(request => (
                            <div key={request.id} className="p-2 sm:p-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-black dark:text-white text-sm truncate">
                                    {request.requesterName}
                                  </p>
                                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                    wants to download: <span className="font-medium truncate">{request.contactName}</span>
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-500">
                                    {new Date(request.requestedAt).toLocaleDateString()} {new Date(request.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                                <div className="flex gap-1 flex-shrink-0">
                                  <button
                                    onClick={() => onApproveVCFRequest?.(request.id)}
                                    className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
                                    title="Approve request"
                                  >
                                    ✓
                                  </button>
                                  <button
                                    onClick={() => onDenyVCFRequest?.(request.id)}
                                    className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                                    title="Deny request"
                                  >
                                    ✗
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  )}
                  
                  {/* Collaborative Birthdays Section (1 Month Before) */}
                  <>
                    <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 bg-purple-50 dark:bg-purple-950">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-purple-600 flex-shrink-0" />
                        <h3 className="font-semibold text-black dark:text-white text-sm sm:text-base">1 Month Advance Birthdays</h3>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Collaborative contacts birthdays</p>
                    </div>
                    
                    <div className="max-h-32 sm:max-h-40 overflow-y-auto">
                      {collaborativeBirthdays.length === 0 ? (
                        <div className="p-3 sm:p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                          No collaborative birthdays in the next month
                        </div>
                      ) : (
                        collaborativeBirthdays.map(contact => {
                          const daysUntil = getDaysUntilBirthday(contact.birthday);
                          
                          return (
                            <div key={`collab-${contact.id}`} className="p-2 sm:p-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-black dark:text-white text-sm truncate">
                                    {contact.firstName} {contact.lastName}
                                  </p>
                                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                                    {formatBirthdayDate(contact.birthday)}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
                                    {contact.company} • Owner: {contact.ownerName}
                                  </p>
                                </div>
                                <div className="text-right flex-shrink-0 ml-2">
                                  <span className="text-xs sm:text-sm font-medium text-purple-600 dark:text-purple-400">
                                    {daysUntil} days
                                  </span>
                                  <p className="text-xs text-purple-500 dark:text-purple-500">
                                    1 month notice
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </>
                  
                  {/* Birthday Notifications Section */}
                  <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 bg-red-50 dark:bg-red-950">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-red-600 flex-shrink-0" />
                      <h3 className="font-semibold text-black dark:text-white text-sm sm:text-base">Upcoming Birthdays</h3>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Next 30 days</p>
                  </div>
                  
                  <div className="max-h-40 sm:max-h-48 overflow-y-auto">
                    {upcomingBirthdays.length === 0 ? (
                      <div className="p-3 sm:p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                        No upcoming birthdays in the next 30 days
                      </div>
                    ) : (
                      upcomingBirthdays.map(contact => {
                        const daysUntil = getDaysUntilBirthday(contact.birthday);
                        const isToday = daysUntil === 0;
                        const isWithinWeek = daysUntil <= 7;
                        
                        return (
                          <div key={contact.id} className="p-2 sm:p-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-black dark:text-white text-sm truncate">
                                  {contact.firstName} {contact.lastName}
                                </p>
                                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                                  {formatBirthdayDate(contact.birthday)}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
                                  {contact.company}
                                </p>
                              </div>
                              <div className="text-right flex-shrink-0 ml-2">
                                <span className={`text-xs sm:text-sm font-medium ${
                                  isToday 
                                    ? 'text-black dark:text-white font-bold' 
                                    : isWithinWeek 
                                      ? 'text-gray-700 dark:text-gray-300'
                                      : 'text-gray-600 dark:text-gray-400'
                                }`}>
                                  {isToday ? 'Today!' : `${daysUntil} days`}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  
                  <div className="p-2 sm:p-3 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="w-full text-xs sm:text-sm text-black dark:text-white hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                    >
                      Close notifications
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-black rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-sm sm:max-w-md border border-gray-300 dark:border-gray-700">
            <div className="flex items-center mb-3 sm:mb-4">
              <div className="bg-red-100 dark:bg-red-900 p-1.5 sm:p-2 rounded-full mr-2 sm:mr-3 flex-shrink-0">
                <LogOut className="w-4 h-4 sm:w-6 sm:h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-black dark:text-white">Confirm Logout</h3>
            </div>
            
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
              Are you sure you want to logout? You will need to sign in again to access your contacts.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-end">
              <button
                onClick={cancelLogout}
                className="w-full sm:w-auto px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 text-black dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition border border-red-500 text-sm sm:text-base"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
