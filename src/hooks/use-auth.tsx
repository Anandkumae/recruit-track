'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User, Role } from '@/lib/types';
import { users } from '@/lib/data';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (role: Role) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'recruittrack.auth';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Failed to parse auth user from localStorage', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (role: Role) => {
    const userToLogin = users.find((u) => u.role === role);
    if (userToLogin) {
      setUser(userToLogin);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userToLogin));
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
