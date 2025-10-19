
import React from 'react';
import AppLayout from '@/components/AppLayout';
import { LoginPage } from '@/components/LoginPage';
import { AppProvider } from '@/contexts/AppContext';
import { useDatabaseContext } from '@/contexts/DatabaseContextSimple';

const AuthenticatedApp: React.FC = () => {
  const { currentUser } = useDatabaseContext();
  
  console.log('Index: Current user:', currentUser);
  
  // Show LoginPage if no user is authenticated
  if (!currentUser) {
    return <LoginPage />;
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
