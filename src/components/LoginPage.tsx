import React, { useState } from 'react';
import { Users, Lock, Building2 } from 'lucide-react';
import { useDatabaseContext } from '../contexts/DatabaseContextSimple';

interface LoginPageProps {
  onLogin?: (success: boolean) => void;
  sessionExpired?: boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, sessionExpired }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useDatabaseContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    if (!username || !password) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }
    
    try {
      const user = await login(username, password);
      if (user) {
        onLogin?.(true); // Optional callback
        // Login successful - context will update automatically
      } else {
        setError('Invalid credentials. Please check your email and password.');
        onLogin?.(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed. Please try again.');
      onLogin?.(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4">
      <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-200 dark:border-gray-800">
        <div className="flex justify-center mb-6">
          <div className="bg-black dark:bg-white p-4 rounded-full">
            <Users className="w-12 h-12 text-white dark:text-black" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-center text-black dark:text-white mb-2">Welcome Back</h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
          {sessionExpired ? 'Your session has expired. Please sign in again.' : 'Sign in to access your contacts'}
        </p>
        
        {sessionExpired && (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  For security reasons, you were automatically signed out when the browser was closed.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-400 dark:border-gray-600 rounded-lg bg-white dark:bg-black text-black dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
              placeholder="user@demo.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-400 dark:border-gray-600 rounded-lg bg-white dark:bg-black text-black dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
              placeholder="••••••••"
            />
          </div>
          
          {error && (
            <div className="bg-gray-100 dark:bg-gray-800 border border-gray-400 dark:border-gray-600 text-black dark:text-white px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-all border border-blue-500"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* Contact Management System branding */}
        <div className="mt-6 flex items-center justify-center gap-3 p-4">
          <div className="flex items-center gap-3">
            <img 
              src="/my-logo.png" 
              alt="Company Logo" 
              className="w-13 h-7 object-contain"
            />
            <div className="text-center">
              <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200">Contact Management System</h3>
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
