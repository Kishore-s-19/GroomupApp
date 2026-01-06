import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('groomupUser'));
    if (user?.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('groomupUser');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

export const authService = {
  login: async (credentials) => {
    return api.post('/auth/login', credentials);
  },
  register: async (userData) => {
    return api.post('/auth/register', userData);
  },
  logout: async () => {
    return api.post('/auth/logout');
  },
};

export const userService = {
  getProfile: async () => {
    return api.get('/user/profile');
  },
  updateProfile: async (data) => {
    return api.put('/user/profile', data);
  },
  getAddresses: async () => {
    return api.get('/user/addresses');
  },
  getOrders: async () => {
    return api.get('/user/orders');
  },
};

export const productService = {
  getAllProducts: async (params) => {
    return api.get('/products', { params });
  },
  getProductById: async (id) => {
    return api.get(`/products/${id}`);
  },
  searchProducts: async (query) => {
    return api.get('/products/search', { params: { query } });
  },
};

export const cartService = {
  getCart: async () => {
    return api.get('/cart');
  },
  addToCart: async (item) => {
    return api.post('/cart/add', item);
  },
  updateCartItem: async (itemId, quantity) => {
    return api.put(`/cart/items/${itemId}`, { quantity });
  },
  removeFromCart: async (itemId) => {
    return api.delete(`/cart/items/${itemId}`);
  },
};

export default api;
