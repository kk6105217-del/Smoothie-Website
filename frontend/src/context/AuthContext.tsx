import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: string | null;
  isAuthenticated: boolean;
  isOwner: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('diy_token'));
  const [role, setRole] = useState<string | null>(localStorage.getItem('diy_role'));
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    if (!token) {
      setUser(null);
      setRole(null);
      setLoading(false);
      return;
    }
    try {
      const u = await api.getMe();
      setUser(u);
      setRole(u.role);
      localStorage.setItem('diy_role', u.role);
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    localStorage.setItem('diy_token', res.access_token);
    localStorage.setItem('diy_role', res.role);
    setToken(res.access_token);
    setRole(res.role);
    await refreshUser();
  };

  const register = async (name: string, email: string, password: string, phone?: string) => {
    const res = await api.register({ name, email, password, phone });
    localStorage.setItem('diy_token', res.access_token);
    localStorage.setItem('diy_role', res.role);
    setToken(res.access_token);
    setRole(res.role);
    await refreshUser();
  };

  const logout = () => {
    localStorage.removeItem('diy_token');
    localStorage.removeItem('diy_role');
    setToken(null);
    setRole(null);
    setUser(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        isAuthenticated: !!token && !!user,
        isOwner: role === 'OWNER',
        loading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
