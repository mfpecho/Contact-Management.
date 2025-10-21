
import React, { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { LoginPage } from '@/components/LoginPage';
import { AppProvider } from '@/contexts/AppContext';
import { useDatabaseContext } from '@/contexts/DatabaseContextSimple';

const AuthenticatedApp: React.FC = () => {
  const { currentUser, isInitializing } = useDatabaseContext();
  const [sessionExpired, setSessionExpired] = useState(false);
  
  console.log('🔍 Index: Current user:', currentUser);
  console.log('🔍 Index: Is initializing:', isInitializing);
  console.log('🔍 Index: Session expired:', sessionExpired);
  
  useEffect(() => {
    // Check if user had a previous session that expired
    const lastSessionData = localStorage.getItem('lastSessionData');
    const currentSession = sessionStorage.getItem('currentUser');
    
    if (lastSessionData && !currentSession && !isInitializing) {
      console.log('Previous session detected but expired');
      setSessionExpired(true);
      // Clear the old session data
      localStorage.removeItem('lastSessionData');
    }
  }, [isInitializing]);
  
  // Show loading screen during initialization
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Show LoginPage if no user is authenticated
  if (!currentUser) {
    return (
      <LoginPage 
        sessionExpired={sessionExpired}
        onLogin={() => setSessionExpired(false)}
      />
    );
  }
  
  // Show main app if user is authenticated
  return <AppLayout />;
};

const Index: React.FC = () => {
  console.log('Index: Rendering...');
  
  return (
    <AppProvider>
      <AuthenticatedApp />
    </AppProvider>
  );
};

export default Index;
