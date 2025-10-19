import React, { useState } from 'react';
import { Users, Lock, Building2 } from 'lucide-react';
import { useDatabaseContext } from '../contexts/DatabaseContextSimple';

interface LoginPageProps {
  onLogin?: (success: boolean) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
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
        <p className="text-center text-gray-600 dark:text-gray-400 mb-8">Sign in to access your contacts</p>
        
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
