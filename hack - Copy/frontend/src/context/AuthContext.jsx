import React, { createContext, useContext, useState, useEffect } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('dayflow_token');
    const storedUser = localStorage.getItem('dayflow_user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    if (data.success) {
      const { token, user } = data.data;
      localStorage.setItem('dayflow_token', token);
      localStorage.setItem('dayflow_user', JSON.stringify(user));
      setToken(token);
      setUser(user);
    }
    return data;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error(err);
    } finally {
      localStorage.removeItem('dayflow_token');
      localStorage.removeItem('dayflow_user');
      setToken(null);
      setUser(null);
      window.location.href = '/login';
    }
  };

  const updateUser = (userData) => {
    const newUser = { ...user, ...userData };
    setUser(newUser);
    localStorage.setItem('dayflow_user', JSON.stringify(newUser));
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    updateUser,
    isAuthenticated: !!token,
    isAdmin: user?.role === 'admin',
    isFirstLogin: user?.isFirstLogin === true
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
