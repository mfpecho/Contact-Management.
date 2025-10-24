import React, { useState, useEffect } from 'react';
import { Users, Lock, Building2, Shield, Zap, Database, Eye, EyeOff } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);
  const [showError, setShowError] = useState(false);
  
  const { login } = useDatabaseContext();

  // Auto-hide error after 3 seconds
  useEffect(() => {
    if (error) {
      setShowError(true);
      const timer = setTimeout(() => {
        setShowError(false);
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [error]);

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
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="relative z-10 bg-white backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-5xl border border-gray-200 overflow-hidden">
        {/* Subtle Border Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-purple-500/5 to-cyan-500/5 rounded-2xl blur-sm"></div>
        
        <div className="relative grid lg:grid-cols-2 min-h-[500px]">
          {/* Left Panel - Futuristic Branding */}
          <div className="bg-gradient-to-br from-white via-blue-100 to-blue-400 p-6 lg:p-8 flex flex-col justify-center items-center relative overflow-hidden">
            <div className="relative z-10 text-center">
              {/* Animated Logo Container with Blended Colors */}
              <div className="mb-6">
                <div className="relative">
                  {/* Multiple Color Layers with Animation */}
                  <div className="relative bg-white p-4 lg:p-6 rounded-full inline-block mb-4 border border-gray-200 shadow-lg overflow-hidden">
                    {/* Animated Background Gradients */}
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-full animate-pulse"></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-400/15 to-pink-400/15 rounded-full animate-pulse delay-1000"></div>
                    <div className="absolute inset-0 bg-gradient-to-l from-indigo-400/10 to-cyan-400/10 rounded-full animate-pulse delay-2000"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-400/15 via-transparent to-purple-400/15 rounded-full" style={{animation: 'colorBlend 6s ease-in-out infinite'}}></div>
                    
                    {/* Rotating Ring */}
                    <div className="absolute inset-2 border-2 border-gradient-to-r from-cyan-300/30 via-purple-300/30 to-blue-300/30 rounded-full" style={{animation: 'rotate 8s linear infinite'}}></div>
                    
                    <Shield className="w-12 h-12 lg:w-16 lg:h-16 text-gray-700 relative z-10" />
                  </div>
                </div>
                
                <div className="relative">
                  <img 
                    src="/my-logo.png" 
                    alt="Company Logo" 
                    className="w-56 h-40 lg:w-72 lg:h-44 object-contain mx-auto mb-0 opacity-90 hover:opacity-100 transition-opacity duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/10 to-purple-400/10 blur-xl rounded-lg"></div>
                </div>
                
                <h1 className="text-xl lg:text-2xl text-gray-700 mb-6 leading-tight font-bold px-2 -mt-2">
                  Contact Management System
                </h1>
              </div>
              
            </div>
          </div>

          {/* Right Panel - Futuristic Login Form */}
          <div className="p-6 lg:p-8 flex flex-col justify-center bg-gray-50/50 backdrop-blur-sm relative">
            {/* Scan Line Animation */}
            <div className="absolute inset-0 overflow-hidden">
              <div 
                className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-30"
                style={{
                  animation: 'scanLine 3s ease-in-out infinite',
                  top: '0%'
                }}
              ></div>
            </div>

            <div className="max-w-xs lg:max-w-sm mx-auto w-full relative z-10">
              <div className="text-center mb-6">
                <h2 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
                  Welcome Back
                </h2>
                <p className="text-sm text-gray-600">
                  {sessionExpired ? 'Neural link expired. Re-establish connection.' : 'Input email and password to continue.'}
                </p>
              </div>
              
              {sessionExpired && (
                <div className="bg-gradient-to-r from-orange-100 to-red-100 backdrop-blur-sm border border-orange-300 rounded-lg p-3 mb-4 relative overflow-hidden shadow-sm">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-200/20 to-red-200/20 animate-pulse"></div>
                  <div className="relative flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center animate-pulse">
                        <svg className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-xs lg:text-sm text-orange-800">
                        Neural security protocol activated. Previous session terminated.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative group">
                  <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-2 group-focus-within:text-gray-900 transition-colors">
                    Username
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-3 py-2.5 lg:py-3 bg-white backdrop-blur-sm border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-300 hover:border-gray-400 text-sm lg:text-base shadow-sm"
                      placeholder="email@ph.howdengroup.com"
                    />
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-500/10 to-purple-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                </div>
                
                <div className="relative group">
                  <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-2 group-focus-within:text-gray-900 transition-colors">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2.5 lg:py-3 pr-10 lg:pr-12 bg-white backdrop-blur-sm border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 hover:border-gray-400 text-sm lg:text-base shadow-sm"
                      placeholder="••••••••••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4 lg:w-5 lg:h-5" /> : <Eye className="w-4 h-4 lg:w-5 lg:h-5" />}
                    </button>
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-500/10 to-cyan-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                </div>
                
                {error && showError && (
                  <div className="bg-gradient-to-r from-red-100 to-pink-100 backdrop-blur-sm border border-red-300 text-red-800 px-3 py-2.5 rounded-lg text-xs lg:text-sm relative overflow-hidden shadow-sm transition-opacity duration-300">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-200/20 to-pink-200/20 animate-pulse"></div>
                    <div className="relative flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      {error}
                    </div>
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full relative overflow-hidden bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white py-3 lg:py-3.5 rounded-lg font-semibold transition-all duration-300 border border-transparent hover:shadow-lg focus:ring-4 focus:ring-cyan-500/30 group text-sm lg:text-base shadow-md"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center justify-center gap-2 lg:gap-3">
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 lg:w-5 lg:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 lg:w-5 lg:h-5" />
                        <span>Sign in</span>
                      </>
                    )}
                  </div>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
