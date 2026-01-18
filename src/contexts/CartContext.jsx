import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { cartService } from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

// Normalize cart items from backend format to frontend format
const normalizeCartItem = (item) => {
  return {
    id: item.id,
    productId: item.productId || item.id,
    name: item.name || item.productName || 'Unnamed Product',
    price: Number(item.price || 0),
    image: item.image || item.productImage || item.imageUrl || 'https://via.placeholder.com/300x400?text=Product',
    brand: item.brand || 'GROOMUP',
    category: item.category || '',
    color: item.color || 'Default',
    size: item.size || 'M',
    volume: item.volume || null,
    artNo: item.artNo || null,
    quantity: item.quantity || 1,
  };
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      const response = await cartService.getCart();
      // Normalize backend response items to frontend format
      const normalizedItems = (response.items || []).map(normalizeCartItem);
      setCart(normalizedItems);
    } catch (err) {
      setError(err.message || 'Failed to fetch cart');
      console.error('Cart fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      // Load cart from localStorage for guest users
      const savedCart = JSON.parse(localStorage.getItem('groomupShoppingBag')) || [];
      // Normalize guest cart items to ensure all required fields are present
      const normalizedCart = savedCart.map(normalizeCartItem);
      setCart(normalizedCart);
      // Update localStorage with normalized data if any items were normalized
      if (normalizedCart.some((item, idx) => JSON.stringify(item) !== JSON.stringify(savedCart[idx]))) {
        localStorage.setItem('groomupShoppingBag', JSON.stringify(normalizedCart));
      }
    }
  }, [isAuthenticated, fetchCart]);

  const addToCart = async (product, color, size, quantity = 1) => {
    // Get product image - handle both images array and imageUrl
    const productImage = (
      (Array.isArray(product.images) && product.images.length > 0 && product.images[0]) ||
      product.imageUrl ||
      product.image ||
      'https://via.placeholder.com/400'
    );

    // Check if product is a serum
    const isSerum = product.category && (
      product.category.toLowerCase() === 'serum' || 
      product.category.toLowerCase().includes('serum')
    );

    const itemData = {
      productId: product.id,
      name: product.name || 'Unnamed Product',
      price: product.price || 0,
      image: productImage,
      brand: product.brand || 'GROOMUP',
      category: product.category || '',
      color: isSerum ? null : (color || 'Default'),
      size: size || (isSerum ? '30ml' : 'M'),
      volume: isSerum ? size : null, // Store volume for serum products
      quantity,
    };

    if (isAuthenticated) {
      try {
        const response = await cartService.addToCart(itemData);
        // Normalize backend response items to frontend format
        // Note: Backend may not return color/size, so we preserve them from itemData
        const normalizedItems = (response.items || []).map(item => {
          const normalized = normalizeCartItem(item);
          // For newly added item, try to preserve color and size from itemData
          if (normalized.productId === itemData.productId) {
            normalized.color = itemData.color;
            normalized.size = itemData.size;
            normalized.volume = itemData.volume;
            normalized.brand = itemData.brand;
            normalized.category = itemData.category;
          }
          return normalized;
        });
        setCart(normalizedItems);
        return { success: true, data: response };
      } catch (err) {
        setError(err.message || 'Failed to add to cart');
        return { success: false, error: err };
      }
    } else {
      // Guest cart logic
      const isSerum = product.category && (
        product.category.toLowerCase() === 'serum' || 
        product.category.toLowerCase().includes('serum')
      );
      
      // For serum products, match by productId and size/volume only
      // For other products, match by productId, color, and size
      const existingIndex = cart.findIndex(item => {
        if (item.productId !== product.id) return false;
        if (isSerum) {
          return item.size === size || item.volume === size;
        } else {
          return item.color === color && item.size === size;
        }
      });
      
      let updatedCart;
      if (existingIndex >= 0) {
        updatedCart = [...cart];
        updatedCart[existingIndex].quantity += quantity;
      } else {
        updatedCart = [...cart, { ...itemData, id: Date.now() }];
      }
      
      setCart(updatedCart);
      localStorage.setItem('groomupShoppingBag', JSON.stringify(updatedCart));
      return { success: true };
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    if (quantity < 1) {
      return removeFromCart(itemId);
    }

    if (isAuthenticated) {
      try {
        const response = await cartService.updateCartItem(itemId, quantity);
        // Normalize backend response items to frontend format
        // Preserve existing item's color/size if backend doesn't return them
        const existingItem = cart.find(item => (item.id === itemId || item.productId === itemId));
        const normalizedItems = (response.items || []).map(item => {
          const normalized = normalizeCartItem(item);
          // Preserve color/size from existing item if backend doesn't return them
          if (existingItem && normalized.productId === existingItem.productId) {
            normalized.color = normalized.color !== 'Default' ? normalized.color : (existingItem.color || 'Default');
            normalized.size = normalized.size !== 'M' ? normalized.size : (existingItem.size || 'M');
            normalized.volume = normalized.volume || existingItem.volume;
            normalized.brand = normalized.brand !== 'GROOMUP' ? normalized.brand : (existingItem.brand || 'GROOMUP');
            normalized.category = normalized.category || existingItem.category;
          }
          return normalized;
        });
        setCart(normalizedItems);
        return { success: true };
      } catch (err) {
        setError(err.message || 'Failed to update cart');
        return { success: false, error: err };
      }
    } else {
      const updatedCart = cart.map(item => 
        item.id === itemId ? { ...item, quantity } : item
      );
      setCart(updatedCart);
      localStorage.setItem('groomupShoppingBag', JSON.stringify(updatedCart));
      return { success: true };
    }
  };

  const removeFromCart = async (itemId) => {
    if (isAuthenticated) {
      try {
        const response = await cartService.removeFromCart(itemId);
        // Normalize backend response items to frontend format
        const normalizedItems = (response.items || []).map(normalizeCartItem);
        setCart(normalizedItems);
        return { success: true };
      } catch (err) {
        setError(err.message || 'Failed to remove item');
        return { success: false, error: err };
      }
    } else {
      const updatedCart = cart.filter(item => item.id !== itemId);
      setCart(updatedCart);
      localStorage.setItem('groomupShoppingBag', JSON.stringify(updatedCart));
      return { success: true };
    }
  };

  const clearCart = async () => {
    if (isAuthenticated) {
      try {
        await cartService.clearCart();
        setCart([]);
      } catch (err) {
        setError(err.message || 'Failed to clear cart');
      }
    } else {
      setCart([]);
      localStorage.removeItem('groomupShoppingBag');
    }
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  const value = {
    cart,
    loading,
    error,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
    getCartCount,
    refreshCart: fetchCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
