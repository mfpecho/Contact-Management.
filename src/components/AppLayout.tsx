import React, { useState, useEffect, useCallback } from 'react';
import { User, Contact, VCFDownloadRequest, ChangelogEntry, ChangelogAction, ChangelogEntity, UserRole } from '../types';
import { useDatabaseContext } from '../contexts/DatabaseContextSimple';
import { LoginPage } from './LoginPage';
import { TermsAndConditions } from './TermsAndConditions';
import { DashboardHeader } from './DashboardHeader';
import { TabNavigation } from './TabNavigation';
import { HeroSection } from './HeroSection';
import { ContactFormModal } from './ContactFormModal';
import { ContactCard } from './ContactCard';
import { ContactList } from './ContactList';
import { CollaborativeTable } from './CollaborativeTable';
import { UserManagementTable } from './UserManagementTable';
import { ChangelogTable } from './ChangelogTable';
import { ActivityDashboard } from './ActivityDashboard';

import { EditUserModal } from './EditUserModal';
import { Plus, Grid3X3, List, Eye, EyeOff } from 'lucide-react';

export default function AppLayout() {
  const {
    users,
    contacts,
    changelog: databaseChangelog,
    currentUser,
    login,
    logout,
    createUser,
    updateUser,
    deleteUser,
    createContact,
    updateContact,
    deleteContact,
    logAction,
    loading,
    createUserBySuperAdmin,
    resetUserPassword,
    generateUsername,
    syncContactsToDatabase
  } = useDatabaseContext();
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [vcfRequests, setVcfRequests] = useState<VCFDownloadRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'personal' | 'collaborative' | 'users' | 'changelog'>('personal');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | undefined>();
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [isLoading, setIsLoading] = useState(true);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>();
  const [isHeroHidden, setIsHeroHidden] = useState(false);

  // Restore state from localStorage on component mount
  useEffect(() => {
    try {
      const savedActiveTab = localStorage.getItem('activeTab') as 'personal' | 'collaborative' | 'users' | 'changelog';
      const savedViewMode = localStorage.getItem('viewMode') as 'card' | 'list';
      const savedTermsAcceptance = localStorage.getItem('hasAcceptedTerms');

      if (savedActiveTab && ['personal', 'collaborative', 'users', 'changelog'].includes(savedActiveTab)) {
        setActiveTab(savedActiveTab);
      }
      if (savedViewMode && ['card', 'list'].includes(savedViewMode)) {
        setViewMode(savedViewMode);
      }
      if (savedTermsAcceptance === 'true') {
        setHasAcceptedTerms(true);
      }
    } catch (error) {
      console.warn('Failed to restore state from localStorage:', error);
      // If there's an error accessing localStorage, continue with defaults
    }
  }, []);

    // Helper function to add changelog entries
  const addChangelogEntry = useCallback(async (action: ChangelogAction, entity: ChangelogEntity, entityId?: string, entityName?: string, details?: string) => {
    if (!currentUser) return;
    
    const description = `${currentUser.name} ${action} ${entity}${entityName ? ` "${entityName}"` : ''}`;
    await logAction(action, entity, description, entityId, entityName, details);
  }, [currentUser, logAction]);

  useEffect(() => {
    // Initialize loading state with timeout to prevent infinite loading
    const timer = setTimeout(() => {
      console.log('Loading timeout reached - showing login page');
      setIsLoading(false);
    }, 3000); // Increased to 3 seconds to allow for database operations

    // If database is loaded and user state is determined, stop loading immediately
    if (!loading) {
      clearTimeout(timer);
      setIsLoading(false);
    }

    return () => clearTimeout(timer);
  }, [loading]);

  // Track login when currentUser changes (for fresh logins)
  useEffect(() => {
    if (currentUser) {
      // Clear loading state when user is authenticated
      setIsLoading(false);
      
      const wasLoggedIn = localStorage.getItem('wasLoggedIn');
      if (!wasLoggedIn) {
        setTimeout(() => {
          addChangelogEntry('login', 'system', undefined, undefined, `User logged in from browser`);
        }, 100);
        localStorage.setItem('wasLoggedIn', 'true');
      }
    }
  }, [currentUser, addChangelogEntry]);

  const handleLogin = async (success: boolean) => {
    if (success) {
      // User is already set in the context by the login function
      addChangelogEntry('login', 'system', undefined, undefined, 'User logged into the system');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    setHasAcceptedTerms(false);
    setActiveTab('personal');
    setViewMode('card');
    // Clear localStorage on logout
    localStorage.removeItem('hasAcceptedTerms');
    localStorage.removeItem('activeTab');
    localStorage.removeItem('viewMode');
    localStorage.removeItem('wasLoggedIn');
  };

  const handleAcceptTerms = () => {
    setHasAcceptedTerms(true);
    // Store terms acceptance in localStorage
    localStorage.setItem('hasAcceptedTerms', 'true');
  };

  const handleDeclineTerms = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    setHasAcceptedTerms(false);
  };

  // Handle tab change and persist to localStorage
  const handleTabChange = (tab: 'personal' | 'collaborative' | 'users' | 'changelog') => {
    setActiveTab(tab);
    localStorage.setItem('activeTab', tab);
  };

  // Handle view mode change and persist to localStorage
  const handleViewModeChange = (mode: 'card' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('viewMode', mode);
  };

  const handleAddContact = () => {
    setModalMode('add');
    setEditingContact(undefined);
    setIsModalOpen(true);
  };

  const handleEditContact = (contact: Contact) => {
    setModalMode('edit');
    setEditingContact(contact);
    setIsModalOpen(true);
  };

  const handleSaveContact = async (contactData: Omit<Contact, 'id' | 'ownerId' | 'ownerName' | 'createdAt'>) => {
    try {
      if (modalMode === 'add') {
        await createContact(contactData);
        await addChangelogEntry('create', 'contact', undefined, `${contactData.firstName} ${contactData.lastName}`, `Added new contact to ${activeTab === 'personal' ? 'personal' : 'collaborative'} contacts`);
      } else if (modalMode === 'edit' && editingContact) {
        await updateContact(editingContact.id, contactData);
        await addChangelogEntry('update', 'contact', editingContact.id, `${contactData.firstName} ${contactData.lastName}`, 'Updated contact information');
      }
    } catch (error) {
      console.error('Failed to save contact:', error);
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      try {
        const contactToDelete = contacts.find(c => c.id === id);
        await deleteContact(id);
        if (contactToDelete) {
          await addChangelogEntry('delete', 'contact', id, `${contactToDelete.firstName} ${contactToDelete.lastName}`, 'Deleted contact from system');
        }
      } catch (error) {
        console.error('Failed to delete contact:', error);
      }
    }
  };

  const handleAddUser = async (userData: Omit<User, 'id'>) => {
    try {
      // Use SuperAdmin function if current user is superadmin
      if (currentUser.role === 'superadmin') {
        await createUserBySuperAdmin({
          email: userData.email,
          password: userData.password || 'defaultPassword123', // In real app, this should be handled properly
          name: userData.name,
          username: userData.username,
          employeeNumber: userData.employeeNumber,
          position: userData.position,
          role: userData.role
        });
      } else {
        // Fall back to regular create user for admins
        await createUser(userData);
      }
      await addChangelogEntry('create', 'user', undefined, userData.name, `Created user account with role: ${userData.role}, Employee Number: ${userData.employeeNumber}, Position: ${userData.position}`);
    } catch (error) {
      console.error('Failed to create user:', error);
      throw error; // Re-throw to let UI handle the error
    }
  };

  const handleEditUser = async (user: User) => {
    console.log('Opening edit modal for user:', user.name);
    setEditingUser(user);
    setIsEditUserModalOpen(true);
  };

  const handleSaveUserEdit = async (userId: string, userData: {
    name: string;
    email: string;
    role: UserRole;
    employeeNumber: string;
    position: string;
    username: string;
  }) => {
    try {
      await updateUser(userId, userData);
      await addChangelogEntry('update', 'user', userId, userData.name, `Updated user information: ${Object.keys(userData).join(', ')}`);
      console.log('User updated successfully:', userData.name);
    } catch (error) {
      console.error('Failed to update user:', error);
      throw error; // Re-throw to let UI handle the error
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const userToDelete = users.find(u => u.id === id);
        await deleteUser(id);
        if (userToDelete) {
          await addChangelogEntry('delete', 'user', id, userToDelete.name, `Deleted user account with role: ${userToDelete.role}`);
        }
      } catch (error) {
        console.error('Failed to delete user:', error);
      }
    }
  };

  const handleAddVCFRequest = (contactId: string, contactName: string, requesterId: string, requesterName: string) => {
    const newRequest: VCFDownloadRequest = {
      id: `vcf-${Date.now()}`,
      requesterId,
      requesterName,
      contactId,
      contactName,
      requestedAt: new Date().toISOString(),
      status: 'pending'
    };
    setVcfRequests([...vcfRequests, newRequest]);
    addChangelogEntry('download', 'contact', contactId, contactName, 'Requested VCF download permission');
  };

  const handleApproveVCFRequest = (requestId: string) => {
    setVcfRequests(vcfRequests.map(req => 
      req.id === requestId ? { ...req, status: 'approved' } : req
    ));
    // You could also trigger the actual download here
    alert('VCF download request approved!');
  };

  const handleDenyVCFRequest = (requestId: string) => {
    setVcfRequests(vcfRequests.map(req => 
      req.id === requestId ? { ...req, status: 'denied' as const } : req
    ));
    alert('VCF download request denied.');
  };

  // Tracking callback functions
  const handleExportTracking = (contactCount: number) => {
    addChangelogEntry('export', 'contact', undefined, undefined, `Exported ${contactCount} contacts to CSV`);
  };

  const handleVCFDownloadTracking = (contactId: string, contactName: string) => {
    addChangelogEntry('download', 'contact', contactId, contactName, 'Downloaded contact as VCF file');
  };

  // Show loading spinner while checking for existing session
  if (isLoading) {
    console.log('AppLayout: Showing loading screen');
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            Checking authentication status...
          </p>
        </div>
      </div>
    );
  }

  // Show login page if no user is authenticated
  if (!currentUser) {
    console.log('AppLayout: Showing login page');
    return <LoginPage onLogin={handleLogin} />;
  }

  if (!hasAcceptedTerms) {
    return (
      <TermsAndConditions 
        onAccept={handleAcceptTerms}
        onDecline={handleDeclineTerms}
        userName={currentUser.name}
      />
    );
  }

  const personalContacts = contacts.filter(c => c.ownerId === currentUser.id);
  
  // Debug contact filtering
  console.log('AppLayout Contact Debug:', {
    totalContacts: contacts.length,
    currentUserId: currentUser.id,
    personalContacts: personalContacts.length,
    allContactOwners: contacts.map(c => ({ id: c.id, ownerId: c.ownerId, ownerName: c.ownerName, name: `${c.firstName} ${c.lastName}` })),
    sampleContact: contacts[0] || 'No contacts available'
  });

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors">
      <DashboardHeader 
        user={currentUser} 
        contacts={contacts} 
        vcfRequests={vcfRequests}
        onLogout={handleLogout}
        onApproveVCFRequest={handleApproveVCFRequest}
        onDenyVCFRequest={handleDenyVCFRequest}
      />
      <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} userRole={currentUser.role} />
      
      {!isHeroHidden && (
        <HeroSection
          userRole={currentUser.role}
          personalContactCount={personalContacts.length}
          collaborativeContactCount={contacts.length}
          contacts={contacts}
          currentUserId={currentUser.id}
          isDashboardHidden={false}
          onToggleDashboard={() => setIsHeroHidden(!isHeroHidden)}
        />
      )}

      {/* Show Hero Section Button - When Hidden */}
      {isHeroHidden && (
        <div className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-4">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center">
              <button
                onClick={() => setIsHeroHidden(false)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition border border-blue-500 shadow-sm hover:shadow-md"
                title="Show Hero Section"
              >
                <Eye className="w-4 h-4" />
                Show Hero Section
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {activeTab === 'personal' ? (
          <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-0">
              <div className="flex items-center gap-3">
                {/* View Toggle Buttons */}
                <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 border border-gray-300 dark:border-gray-600">
                  <button
                    onClick={() => handleViewModeChange('card')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all text-sm ${
                      viewMode === 'card'
                        ? 'bg-white dark:bg-black text-black dark:text-white shadow-sm border border-gray-300 dark:border-gray-600'
                        : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
                    }`}
                    title="Card view"
                  >
                    <Grid3X3 className="w-4 h-4" />
                    <span className="hidden sm:inline">Cards</span>
                  </button>
                  <button
                    onClick={() => handleViewModeChange('list')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all text-sm ${
                      viewMode === 'list'
                        ? 'bg-white dark:bg-black text-black dark:text-white shadow-sm border border-gray-300 dark:border-gray-600'
                        : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
                    }`}
                    title="List view"
                  >
                    <List className="w-4 h-4" />
                    <span className="hidden sm:inline">List</span>
                  </button>
                </div>
                
                {/* My Contacts Title */}
                <h2 className="text-xl sm:text-2xl font-bold text-black dark:text-white">My Contacts ({personalContacts.length})</h2>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Debug Sync Button - only for Admin and SuperAdmin in development */}
                {import.meta.env.DEV && (currentUser.role === 'admin' || currentUser.role === 'superadmin') && (
                  <button
                    onClick={async () => {
                      console.log('🔄 Manual contact sync triggered...')
                      try {
                        await syncContactsToDatabase()
                        console.log('✅ Manual sync completed')
                      } catch (error) {
                        console.error('❌ Manual sync failed:', error)
                      }
                    }}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition border border-yellow-500 text-sm"
                    title="Force sync contacts with database (Admin/SuperAdmin only)"
                  >
                    🔄
                  </button>
                )}
                
                {/* Add Contact Button */}
                <button
                  onClick={handleAddContact}
                  className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition border border-blue-500 text-sm sm:text-base"
                >
                  <Plus className="w-4 h-4" />
                  <span className="sm:inline">Add Contact</span>
                </button>
              </div>
            </div>
            
            {/* Dashboard Content - always visible when hero is shown */}
            {(
              <>
                {personalContacts.length === 0 ? (
              <div className="text-center py-8 sm:py-12 lg:py-16 bg-gray-50 dark:bg-gray-900 rounded-lg sm:rounded-xl shadow-lg border border-gray-200 dark:border-gray-800">
                <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm sm:text-base">No contacts yet. Start by adding your first contact!</p>
                <button
                  onClick={handleAddContact}
                  className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition border border-blue-500 text-sm sm:text-base"
                >
                  <Plus className="w-4 sm:w-5 h-4 sm:h-5" />
                  Add Your First Contact
                </button>
              </div>
            ) : viewMode === 'card' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {personalContacts.map(contact => (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    currentUserId={currentUser.id}
                    userRole={currentUser.role}
                    onEdit={handleEditContact}
                    onDelete={handleDeleteContact}
                  />
                ))}
              </div>
            ) : (
              <ContactList
                contacts={personalContacts}
                currentUserId={currentUser.id}
                userRole={currentUser.role}
                onEdit={handleEditContact}
                onDelete={handleDeleteContact}
                onExport={handleExportTracking}
                onVCFDownload={handleVCFDownloadTracking}
              />
            )}
              </>
            )}
            
            {/* Hidden Dashboard Message */}

          </div>
        ) : activeTab === 'collaborative' ? (
          <div>
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-black dark:text-white">Collaborative Contacts ({contacts.length})</h2>
              {/* Debug button for collaborative view - only for Admin and SuperAdmin */}
              {import.meta.env.DEV && (currentUser.role === 'admin' || currentUser.role === 'superadmin') && (
                <button
                  onClick={async () => {
                    console.log('🔄 Debug collaborative contacts...')
                    console.log('Total contacts:', contacts.length)
                    console.log('All contacts:', contacts.map(c => ({ name: `${c.firstName} ${c.lastName}`, owner: c.ownerName, ownerId: c.ownerId })))
                    await syncContactsToDatabase()
                  }}
                  className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition border border-purple-500 text-sm"
                  title="Debug collaborative contacts (Admin/SuperAdmin only)"
                >
                  🔍 Debug
                </button>
              )}
            </div>
            <CollaborativeTable
              contacts={contacts}
              currentUserId={currentUser.id}
              currentUserName={currentUser.name}
              userRole={currentUser.role}
              onEdit={handleEditContact}
              onDelete={handleDeleteContact}
              onVCFRequest={handleAddVCFRequest}
              onExport={handleExportTracking}
              onVCFDownload={handleVCFDownloadTracking}
            />
          </div>
        ) : activeTab === 'users' ? (
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-black dark:text-white mb-4 sm:mb-6">User Management ({users.length})</h2>
            <UserManagementTable
              users={users}
              currentUserId={currentUser.id}
              currentUserRole={currentUser.role}
              onEdit={handleEditUser}
              onDelete={handleDeleteUser}
              onAdd={handleAddUser}
            />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Activity Dashboard */}
            <ActivityDashboard />
            
            {/* Changelog Table */}
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-black dark:text-white mb-4">System Changelog ({databaseChangelog.length})</h2>
              <ChangelogTable entries={databaseChangelog} />
            </div>
          </div>
        )}
      </main>

      <ContactFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveContact}
        contact={editingContact}
        mode={modalMode}
      />

      <EditUserModal
        isOpen={isEditUserModalOpen}
        onClose={() => {
          setIsEditUserModalOpen(false);
          setEditingUser(undefined);
        }}
        onSave={handleSaveUserEdit}
        user={editingUser}
      />
    </div>
  );
}
