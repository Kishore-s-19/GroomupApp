import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext();

const isValidJwt = (token) => {
  if (typeof token !== 'string') return false;
  const parts = token.split('.');
  return parts.length === 3 && parts.every(Boolean);
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('groomupUser');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (isValidJwt(parsed?.token)) {
          return parsed;
        }
      } catch {
        localStorage.removeItem('groomupUser');
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Session check is now handled in state initialization, 
    // but we can keep the loading state for any future async checks if needed.
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      setError(null);
      const response = await authService.login(credentials);
      const token = response?.token;
      if (!isValidJwt(token)) {
        throw new Error('Invalid login response');
      }
      const userData = { token, email: credentials?.email };
      localStorage.setItem('groomupUser', JSON.stringify(userData));
      setUser(userData);
      return { success: true, data: response };
    } catch (err) {
      setError(err.message || 'Login failed');
      return { success: false, error: err };
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      const response = await authService.register(userData);
      const token = response?.token;
      if (!isValidJwt(token)) {
        throw new Error('Invalid registration response');
      }
      const storedUserData = { token, email: userData?.email, name: userData?.name };
      localStorage.setItem('groomupUser', JSON.stringify(storedUserData));
      setUser(storedUserData);
      return { success: true, data: response };
    } catch (err) {
      setError(err.message || 'Registration failed');
      return { success: false, error: err };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('groomupUser');
      localStorage.removeItem('groomupShoppingBag');
      setUser(null);
      window.location.href = '/login';
    }
  };

  const updateUser = (userData) => {
    const updatedUser = { ...user, ...userData };
    localStorage.setItem('groomupUser', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: isValidJwt(user?.token),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
