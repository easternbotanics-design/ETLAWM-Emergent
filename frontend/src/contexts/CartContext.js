import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchCart = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/cart`, {
        withCredentials: true
      });
      setCart(response.data);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (user) {
      fetchCart();
    }
  }, [user]);

  const addToCart = async (productId, variantId, quantity = 1) => {
    try {
      await axios.post(
        `${API_URL}/api/cart/items`,
        { product_id: productId, variant_id: variantId, quantity },
        { withCredentials: true }
      );
      await fetchCart();
    } catch (error) {
      throw error;
    }
  };

  const updateCartItem = async (productId, variantId, quantity) => {
    try {
      await axios.put(
        `${API_URL}/api/cart/items/${productId}`,
        null,
        {
          params: { quantity, variant_id: variantId },
          withCredentials: true
        }
      );
      await fetchCart();
    } catch (error) {
      throw error;
    }
  };

  const removeFromCart = async (productId, variantId) => {
    try {
      await axios.delete(
        `${API_URL}/api/cart/items/${productId}`,
        {
          params: { variant_id: variantId },
          withCredentials: true
        }
      );
      await fetchCart();
    } catch (error) {
      throw error;
    }
  };

  const clearCart = async () => {
    try {
      await axios.delete(`${API_URL}/api/cart`, { withCredentials: true });
      setCart({ items: [] });
    } catch (error) {
      throw error;
    }
  };

  const getCartCount = () => {
    return cart.items?.reduce((total, item) => total + item.quantity, 0) || 0;
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
        getCartCount,
        fetchCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};