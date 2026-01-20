import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext();

const isValidJwt = (token) => {
  if (typeof token !== 'string') return false;
  const parts = token.split('.');
  return parts.length === 3 && parts.every(Boolean);
};

const isTokenExpired = (token) => {
  if (!isValidJwt(token)) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp;
    if (!exp) return false;
    return Date.now() >= exp * 1000;
  } catch {
    return true;
  }
};

const getTokenExpiry = (token) => {
  if (!isValidJwt(token)) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
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
        if (isValidJwt(parsed?.token) && !isTokenExpired(parsed?.token)) {
          return parsed;
        }
        localStorage.removeItem('groomupUser');
      } catch {
        localStorage.removeItem('groomupUser');
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const clearAuth = useCallback(() => {
    localStorage.removeItem('groomupUser');
    localStorage.removeItem('groomupShoppingBag');
    setUser(null);
  }, []);

  useEffect(() => {
    if (!user?.token) return;

    if (isTokenExpired(user.token)) {
      clearAuth();
      return;
    }

    const expiry = getTokenExpiry(user.token);
    if (expiry) {
      const timeUntilExpiry = expiry - Date.now();
      const bufferTime = 60000;
      const timeout = Math.max(timeUntilExpiry - bufferTime, 0);
      
      const timer = setTimeout(() => {
        clearAuth();
        window.location.href = '/login?expired=true';
      }, timeout);

      return () => clearTimeout(timer);
    }
  }, [user?.token, clearAuth]);

  const login = async (credentials) => {
    try {
      setError(null);
      setLoading(true);
      
      const sanitizedCredentials = {
        email: credentials?.email?.trim().toLowerCase(),
        password: credentials?.password
      };
      
      const response = await authService.login(sanitizedCredentials);
      const token = response?.token;
      
      if (!isValidJwt(token)) {
        throw new Error('Invalid login response');
      }
      
      if (isTokenExpired(token)) {
        throw new Error('Received expired token');
      }
      
      const userData = { 
        token, 
        email: sanitizedCredentials.email,
        loginTime: Date.now()
      };
      localStorage.setItem('groomupUser', JSON.stringify(userData));
      setUser(userData);
      return { success: true, data: response };
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Login failed';
      setError(errorMessage);
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      setLoading(true);
      
      const sanitizedData = {
        email: userData?.email?.trim().toLowerCase(),
        password: userData?.password,
        name: userData?.name?.trim()
      };
      
      const response = await authService.register(sanitizedData);
      const token = response?.token;
      
      if (!isValidJwt(token)) {
        throw new Error('Invalid registration response');
      }
      
      const storedUserData = { 
        token, 
        email: sanitizedData.email, 
        name: sanitizedData.name,
        loginTime: Date.now()
      };
      localStorage.setItem('groomupUser', JSON.stringify(storedUserData));
      setUser(storedUserData);
      return { success: true, data: response };
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Registration failed';
      setError(errorMessage);
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await authService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      clearAuth();
      setLoading(false);
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
    clearError: () => setError(null),
    isAuthenticated: isValidJwt(user?.token) && !isTokenExpired(user?.token),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
