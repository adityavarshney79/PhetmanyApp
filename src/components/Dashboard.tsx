import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { getAllUsers, createUserProfile, updateUserProfile, deleteUserProfile } from '../lib/firebase';
import AdminDashboard from './AdminDashboard';
import CustomerStore from './CustomerStore';

interface DashboardProps {
  currentUser: UserProfile;
  onUpdateCurrentUser: (updates: Partial<UserProfile>) => void;
  onLogout: () => void;
  logoUrl: string;
  theme: 'light' | 'orange' | 'green' | 'dark' | 'navy';
  setTheme: (theme: 'light' | 'orange' | 'green' | 'dark' | 'navy') => void;
}

export default function Dashboard({ currentUser, onUpdateCurrentUser, onLogout, logoUrl, theme, setTheme }: DashboardProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getAllUsers();
      setUsers(data);
      // Synchronize current user with latest from db if their fields (like walletBalance) changed
      const currentLatest = data.find(u => u.id === currentUser.id);
      if (currentLatest) {
        onUpdateCurrentUser(currentLatest);
      }
    } catch (e) {
      console.error("Failed to load user directory from Firestore:", e);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (profile: UserProfile) => {
    try {
      await createUserProfile(profile);
      await fetchUsers();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateUser = async (id: string, updates: Partial<UserProfile>) => {
    try {
      await updateUserProfile(id, updates);
      await fetchUsers();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteUser = async (id: string, username: string) => {
    try {
      await deleteUserProfile(id);
      await fetchUsers();
    } catch (e) {
      console.error(e);
    }
  };

  // Determine if user has administrative privileges
  const isAdmin = 
    currentUser.role === 'Super Administrator' || 
    currentUser.role === 'AdminMaster' || 
    currentUser.role === 'Store Manager' || 
    currentUser.role === 'Content Editor' || 
    currentUser.role === 'Customer Support' || 
    currentUser.role === 'Technical/Dev';

  if (isAdmin) {
    return (
      <AdminDashboard 
        currentUser={currentUser}
        onUpdateCurrentUser={onUpdateCurrentUser}
        users={users}
        onAddUser={handleAddUser}
        onUpdateUser={handleUpdateUser}
        onDeleteUser={handleDeleteUser}
        onRefreshUsers={fetchUsers}
        logoUrl={logoUrl}
        onLogout={onLogout}
        theme={theme}
        setTheme={setTheme}
      />
    );
  }

  return (
    <CustomerStore 
      currentUser={currentUser}
      onUpdateCurrentUser={onUpdateCurrentUser}
      logoUrl={logoUrl}
      onLogout={onLogout}
      theme={theme}
      setTheme={setTheme}
    />
  );
}
