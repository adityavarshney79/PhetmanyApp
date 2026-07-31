/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import AnniversaryBanner from './components/AnniversaryBanner';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import Dashboard from './components/Dashboard';
import ThemeSelector from './components/ThemeSelector';
import { UserProfile } from './types';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentView, setCurrentView] = useState<'login' | 'register'>('login');
  const theme = 'dark';

  useEffect(() => {
    const classes = ['theme-light', 'theme-orange', 'theme-green', 'theme-dark', 'theme-navy'];
    document.body.classList.remove(...classes);
    document.body.classList.add(`theme-dark`);
  }, []);
  
  const LOGO_URL = 'https://raavsolutions.com/phetmanyapp/images/bluelogo.jpeg';

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
  };

  const handleRegisterSuccess = (user: UserProfile) => {
    setCurrentUser(user);
  };

  const handleLoginAsGuest = () => {
    const guestUser: UserProfile = {
      id: 'guest_' + Date.now(),
      username: 'guest_user',
      fullName: 'Guest Account',
      email: 'guest@phetmany.co',
      role: 'Guest',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      status: 'Active',
    };
    setCurrentUser(guestUser);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('login');
  };

  const handleUpdateCurrentUser = (updates: Partial<UserProfile>) => {
    if (currentUser) {
      setCurrentUser(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  // If logged in, present the full interactive RBAC and Firestore dashboard
  if (currentUser) {
    return (
      <Dashboard
        currentUser={currentUser}
        onUpdateCurrentUser={handleUpdateCurrentUser}
        onLogout={handleLogout}
        logoUrl={LOGO_URL}
        theme={theme}
        setTheme={() => {}}
      />
    );
  }

  // Else, present the dual-panel high-fidelity entrance layout (matching the uploaded image)
  return (
    <div id="entrance-canvas" className="min-h-screen bg-slate-900 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative transition-colors duration-300">
      {/* Background ambient aesthetics */}
      <div className="fixed top-0 left-0 w-full h-full bg-[radial-gradient(#889bd0_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_80%,transparent_100%)] opacity-10 pointer-events-none" />

      {/* Main Split Screen Container */}
      <div 
        id="portal-card-frame" 
        className="w-full max-w-6xl bg-slate-950 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 border border-slate-800/80 relative z-10"
      >
        
        {/* Left Side: Authentication Forms (LoginForm / RegisterForm) */}
        <div id="auth-section" className="col-span-1 md:col-span-7 lg:col-span-6 h-full min-h-[600px] flex flex-col justify-stretch bg-slate-950">
          {currentView === 'login' ? (
            <LoginForm
              onLoginSuccess={handleLoginSuccess}
              onNavigateToRegister={() => setCurrentView('register')}
              onLoginAsGuest={handleLoginAsGuest}
              logoUrl={LOGO_URL}
            />
          ) : (
            <RegisterForm
              onRegisterSuccess={handleRegisterSuccess}
              onBackToLogin={() => setCurrentView('login')}
              logoUrl={LOGO_URL}
            />
          )}
        </div>

        {/* Right Side: Anniversary Banner (hides on small mobile, takes 5 columns on medium, 6 on large screens) */}
        <div id="banner-section" className="hidden md:block md:col-span-5 lg:col-span-6 h-full min-h-[600px]">
          <AnniversaryBanner logoUrl={LOGO_URL} />
        </div>

      </div>
    </div>
  );
}
