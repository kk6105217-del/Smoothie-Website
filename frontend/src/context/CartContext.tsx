import React, { createContext, useContext, useState, useEffect } from 'react';
import { Cart } from '../types';
import { api } from '../services/api';

interface CartContextType {
  cart: Cart | null;
  loading: boolean;
  totalItems: number;
  subtotalPaise: number;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshCart = async () => {
    try {
      const c = await api.getCart();
      setCart(c);
    } catch (e) {
      console.error('Failed to fetch cart', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshCart();
  }, []);

  const addToCart = async (productId: string, quantity: number = 1) => {
    const updated = await api.addToCart(productId, quantity);
    setCart(updated);
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    const updated = await api.updateCartItem(itemId, quantity);
    setCart(updated);
  };

  const removeItem = async (itemId: string) => {
    const updated = await api.removeCartItem(itemId);
    setCart(updated);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        totalItems: cart?.total_items || 0,
        subtotalPaise: cart?.subtotal_paise || 0,
        addToCart,
        updateQuantity,
        removeItem,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
};
