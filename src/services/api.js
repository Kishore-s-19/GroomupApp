import axios from 'axios';
import { mockProducts } from './mockData';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || true; // Default to true for now

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
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

// Response interceptor for error handling
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

// Helper to simulate network delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Auth Services
export const authService = {
  login: async (credentials) => {
    if (USE_MOCK) {
      await delay(800);
      // Simulate successful login for demo purposes
      if (credentials.email && credentials.password) {
         return {
          user: { id: 1, name: "Test User", email: credentials.email, role: "USER" },
          token: "mock-jwt-token-12345"
        };
      }
      throw new Error("Invalid credentials");
    }
    return api.post('/auth/login', credentials);
  },
  register: async (userData) => {
    if (USE_MOCK) {
      await delay(800);
      return { message: "Registration successful. Please login.", user: { id: 1, ...userData } };
    }
    return api.post('/auth/register', userData);
  },
  logout: async () => {
    if (USE_MOCK) {
      await delay(200);
      return { message: "Logged out successfully" };
    }
    return api.post('/auth/logout');
  },
};

// User Services
export const userService = {
  getProfile: async () => {
    if (USE_MOCK) {
      await delay(500);
      return {
        fullName: "Kishore Kumar",
        email: "kdkishore315@gmail.com",
        phone: "+91 9342568533",
        dob: "1995-05-15",
        gender: "Male",
      };
    }
    return api.get('/user/profile');
  },
  updateProfile: async (data) => {
    if (USE_MOCK) {
      await delay(500);
      return data;
    }
    return api.put('/user/profile', data);
  },
  getAddresses: async () => {
    if (USE_MOCK) {
      await delay(400);
      return [
        {
          id: 1,
          name: "Kishore Kumar",
          type: "Home",
          address: "123 Main Street, Apartment 4B",
          city: "Mumbai, Maharashtra 400001",
          country: "India",
          phone: "+91 98765 43210",
          isDefault: true
        },
        {
          id: 2,
          name: "Kishore Kumar",
          type: "Work",
          address: "456 Corporate Park, Floor 2",
          city: "Delhi, Delhi 110001",
          country: "India",
          phone: "+91 87654 32109",
          isDefault: false
        }
      ];
    }
    return api.get('/user/addresses');
  },
  getOrders: async () => {
    if (USE_MOCK) {
      await delay(600);
      return [
        {
          id: "001546632",
          date: "October 25, 2024",
          total: "₹1199",
          items: 1,
          status: "Delivered"
        },
        {
          id: "000871822",
          date: "August 09, 2023",
          total: "₹1299",
          items: 1,
          status: "Delivered"
        }
      ];
    }
    return api.get('/user/orders');
  }
};

// Product Services
export const productService = {
  getAllProducts: async (params) => {
    if (USE_MOCK) {
      await delay(500);
      let filtered = [...mockProducts];
      if (params?.category && params.category !== 'all') {
        filtered = filtered.filter(p => p.category === params.category);
      }
      return filtered;
    }
    return api.get('/products', { params });
  },
  getProductById: async (id) => {
    if (USE_MOCK) {
      await delay(300);
      const product = mockProducts.find(p => p.id === parseInt(id));
      if (!product) throw new Error("Product not found");
      return product;
    }
    return api.get(`/products/${id}`);
  },
  searchProducts: async (query) => {
    if (USE_MOCK) {
      await delay(400);
      if (!query) return [];
      const lowerQuery = query.toLowerCase();
      return mockProducts.filter(p => 
        p.name.toLowerCase().includes(lowerQuery) || 
        p.brand.toLowerCase().includes(lowerQuery) ||
        p.category.toLowerCase().includes(lowerQuery) ||
        p.description.toLowerCase().includes(lowerQuery)
      );
    }
    return api.get('/products/search', { params: { query } });
  }
};

// Cart Services
export const cartService = {
  getCart: async () => {
    if (USE_MOCK) {
      await delay(200);
      const saved = JSON.parse(localStorage.getItem('groomupShoppingBag')) || [];
      return { items: saved };
    }
    return api.get('/cart');
  },
  addToCart: async (item) => {
    if (USE_MOCK) {
      await delay(200);
      const saved = JSON.parse(localStorage.getItem('groomupShoppingBag')) || [];
      const idx = saved.findIndex(
        (i) =>
          i.productId === item.productId &&
          i.color === item.color &&
          i.size === item.size
      );
      let updated;
      if (idx >= 0) {
        updated = [...saved];
        updated[idx].quantity = (updated[idx].quantity || 1) + (item.quantity || 1);
      } else {
        updated = [...saved, { ...item, id: Date.now() }];
      }
      localStorage.setItem('groomupShoppingBag', JSON.stringify(updated));
      return { items: updated };
    }
    return api.post('/cart/add', item);
  },
  updateCartItem: async (itemId, quantity) => {
    if (USE_MOCK) {
      await delay(200);
      const saved = JSON.parse(localStorage.getItem('groomupShoppingBag')) || [];
      let updated = saved.map((i) => (i.id === itemId ? { ...i, quantity } : i));
      // Remove if quantity < 1
      updated = updated.filter((i) => (i.quantity || 0) > 0);
      localStorage.setItem('groomupShoppingBag', JSON.stringify(updated));
      return { items: updated };
    }
    return api.put(`/cart/items/${itemId}`, { quantity });
  },
  removeFromCart: async (itemId) => {
    if (USE_MOCK) {
      await delay(200);
      const saved = JSON.parse(localStorage.getItem('groomupShoppingBag')) || [];
      const updated = saved.filter((i) => i.id !== itemId);
      localStorage.setItem('groomupShoppingBag', JSON.stringify(updated));
      return { items: updated };
    }
    return api.delete(`/cart/items/${itemId}`);
  }
};

export default api;
