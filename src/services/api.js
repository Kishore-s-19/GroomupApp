import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const isValidJwt = (token) => {
  if (typeof token !== 'string') return false;
  const parts = token.split('.');
  return parts.length === 3 && parts.every(Boolean);
};

const toErrorMessage = (payload, fallbackMessage) => {
  if (!payload) return fallbackMessage;
  if (typeof payload === 'string') return payload || fallbackMessage;
  if (typeof payload !== 'object') return fallbackMessage;

  return (
    payload.message ||
    payload.error ||
    payload.title ||
    payload.detail ||
    payload.path ||
    fallbackMessage
  );
};

const toApiError = (axiosError) => {
  const status = axiosError?.response?.status;
  const data = axiosError?.response?.data;
  const fallbackMessage = axiosError?.message || 'Request failed';
  const baseMessage = toErrorMessage(data, fallbackMessage);
  const message = status ? `${status}: ${baseMessage}` : baseMessage;

  const err = new Error(message);
  err.status = status;
  err.data = data;
  err.url = axiosError?.config?.url;
  return err;
};

const normalizeProduct = (product) => {
  if (!product || typeof product !== 'object') return product;

  const imageUrl = product.imageUrl ?? product.image ?? null;
  const images = Array.isArray(product.images) ? product.images.filter(Boolean) : [];
  const normalizedImages = images.length === 0 && imageUrl ? [imageUrl] : images;

  return {
    ...product,
    imageUrl: imageUrl ?? normalizedImages[0] ?? null,
    images: normalizedImages,
  };
};

const normalizeProductsResponse = (payload) => {
  if (Array.isArray(payload)) return payload.map(normalizeProduct);
  if (payload?.content && Array.isArray(payload.content)) {
    return { ...payload, content: payload.content.map(normalizeProduct) };
  }
  return payload;
};

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    let user = null;
    try {
      user = JSON.parse(localStorage.getItem('groomupUser') || 'null');
    } catch {
      localStorage.removeItem('groomupUser');
    }
    if (isValidJwt(user?.token)) {
      config.headers.Authorization = `Bearer ${user.token}`;
    } else {
      if (config.headers?.Authorization) delete config.headers.Authorization;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;
    const hadAuthHeader = Boolean(error.config?.headers?.Authorization);

    if (hadAuthHeader && (status === 401 || status === 403)) {
      localStorage.removeItem('groomupUser');
      window.location.href = '/login';
    }
    return Promise.reject(toApiError(error));
  }
);

// Auth Services
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

// User Services
export const userService = {
  getProfile: async () => {
    return api.get('/users/me');
  },
  updateProfile: async (data) => {
    return api.put('/users/me', data);
  },
  getAddresses: async () => {
    return [];
  },
  getOrders: async () => {
    return api.get('/orders');
  }
};

// Product Services
export const productService = {
  getAllProducts: async (params) => {
    const data = await api.get('/products', { params });
    const normalized = normalizeProductsResponse(data);
    if (Array.isArray(normalized)) return normalized;
    if (normalized?.content && Array.isArray(normalized.content)) return normalized.content;
    return [];
  },
  getProductById: async (id) => {
    const data = await api.get(`/products/${id}`);
    return normalizeProduct(data);
  },
  searchProducts: async (query) => {
    const q = String(query ?? "").trim();
    if (!q) return [];

    const normalize = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const nq = normalize(q);
    const nq2 = nq.endsWith('s') ? nq.slice(0, -1) : nq;

    const productsPayload = await api.get('/products');
    const products = Array.isArray(productsPayload)
      ? productsPayload.map(normalizeProduct)
      : productsPayload?.content?.map?.(normalizeProduct) ?? [];

    return products.filter((p) => {
      const name = normalize(p.name);
      const category = normalize(p.category);
      const description = normalize(p.description);

      return (
        name.includes(nq) ||
        category.includes(nq) ||
        description.includes(nq) ||
        (nq2 && (name.includes(nq2) || category.includes(nq2) || description.includes(nq2)))
      );
    });
  }
};

// Cart Services
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
  clearCart: async () => {
    return api.delete('/cart');
  }
};

export default api;
