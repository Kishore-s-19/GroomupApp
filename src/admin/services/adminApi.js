import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
const ADMIN_STORAGE_KEY = 'groomupAdmin';

const adminApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const decodeJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

export const isValidAdminToken = (token) => {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  
  const payload = decodeJwt(token);
  if (!payload) return false;
  
  if (payload.exp && payload.exp * 1000 < Date.now()) return false;
  
  const roles = payload.roles || payload.role || payload.authorities || [];
  const roleArray = Array.isArray(roles) ? roles : [roles];
  const hasAdminRole = roleArray.some(r => 
    r === 'ADMIN' || r === 'ROLE_ADMIN' || (r.authority && (r.authority === 'ROLE_ADMIN' || r.authority === 'ADMIN'))
  );
  
  return hasAdminRole;
};

export const getAdminToken = () => {
  try {
    const data = JSON.parse(localStorage.getItem(ADMIN_STORAGE_KEY) || 'null');
    return data?.token || null;
  } catch {
    return null;
  }
};

export const getAdminUser = () => {
  try {
    return JSON.parse(localStorage.getItem(ADMIN_STORAGE_KEY) || 'null');
  } catch {
    return null;
  }
};

export const setAdminAuth = (userData) => {
  localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(userData));
};

export const clearAdminAuth = () => {
  localStorage.removeItem(ADMIN_STORAGE_KEY);
};

export const isAdminAuthenticated = () => {
  const token = getAdminToken();
  return isValidAdminToken(token);
};

adminApi.interceptors.request.use(
  (config) => {
    const token = getAdminToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

adminApi.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;
    
    if (status === 401 || status === 403) {
      clearAdminAuth();
      window.location.href = '/admin/login';
    }
    
    const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Request failed';
    return Promise.reject(new Error(message));
  }
);

export const adminAuthService = {
  login: async (credentials) => {
    const response = await adminApi.post('/auth/login', credentials);
    
    if (!response.token) {
      throw new Error('Invalid response from server');
    }
    
    if (!isValidAdminToken(response.token)) {
      throw new Error('Access denied. Admin privileges required.');
    }
    
    const adminData = {
      token: response.token,
      email: response.email || credentials.email,
      name: response.name || 'Admin',
      role: 'ADMIN'
    };
    
    setAdminAuth(adminData);
    return adminData;
  },
  
  logout: () => {
    clearAdminAuth();
  }
};

export const adminProductService = {
  getAllProducts: async () => {
    return adminApi.get('/products');
  },
  
  getProductById: async (id) => {
    return adminApi.get(`/products/${id}`);
  },
  
  createProduct: async (productData) => {
    return adminApi.post('/products', productData);
  },
  
  updateProduct: async (id, productData) => {
    return adminApi.put(`/products/${id}`, productData);
  },
  
  deleteProduct: async (id) => {
    return adminApi.delete(`/products/${id}`);
  }
};

export default adminApi;
