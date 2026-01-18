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

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();

  const normalizeCartItem = (item) => ({
    id: item.id,
    productId: item.productId,
    name: item.productName || item.name || 'Product',
    image: item.productImage || item.image || '',
    imageUrl: item.productImage || item.imageUrl || item.image || '',
    price: item.price,
    quantity: item.quantity,
    brand: item.brand || 'GROOMUP',
    color: item.color || 'N/A',
    size: item.size || 'N/A',
    artNo: item.artNo || item.productId?.toString() || 'N/A',
    category: item.category || '',
  });

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      const response = await cartService.getCart();
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
      setCart(savedCart);
    }
  }, [isAuthenticated, fetchCart]);

  const addToCart = async (product, color, size, quantity = 1) => {
    const productImage = (Array.isArray(product.images) && product.images.length > 0) 
      ? product.images[0] 
      : (product.imageUrl || product.image || '');
    
    const itemData = {
      productId: product.id,
      name: product.name || 'Product',
      price: product.price,
      image: productImage,
      brand: product.brand || 'GROOMUP',
      color,
      size,
      quantity,
      category: product.category || '',
      artNo: product.artNo || product.id?.toString() || '',
    };

    if (isAuthenticated) {
      try {
        const response = await cartService.addToCart(itemData);
        const normalizedItems = (response.items || []).map(normalizeCartItem);
        setCart(normalizedItems);
        return { success: true, data: response };
      } catch (err) {
        setError(err.message || 'Failed to add to cart');
        return { success: false, error: err };
      }
    } else {
      // Guest cart logic
      const existingIndex = cart.findIndex(item => 
        item.productId === product.id && 
        item.color === color &&
        item.size === size
      );
      
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
        const normalizedItems = (response.items || []).map(normalizeCartItem);
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
