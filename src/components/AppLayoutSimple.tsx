import React, { useState } from 'react';
import { useDatabaseContext } from '../contexts/DatabaseContextSimple';
import { LoginPage } from './LoginPage';

export default function AppLayoutSimple() {
  console.log('AppLayoutSimple: Rendering...');
  
  const { currentUser, login, logout } = useDatabaseContext();
  
  console.log('AppLayoutSimple: Current user:', currentUser);

  const handleLogin = async (success: boolean) => {
    console.log('AppLayoutSimple: Login result:', success);
    if (success) {
      console.log('Login successful');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!currentUser) {
    console.log('AppLayoutSimple: Showing login page');
    return <LoginPage onLogin={handleLogin} />;
  }

  console.log('AppLayoutSimple: Showing dashboard');
  return (
    <div className="min-h-screen bg-white dark:bg-black p-8">
      <h1 className="text-2xl font-bold text-black dark:text-white mb-4">
        Welcome, {currentUser.name}!
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        Role: {currentUser.role}
      </p>
      <button
        onClick={handleLogout}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Logout
      </button>
    </div>
  );
}