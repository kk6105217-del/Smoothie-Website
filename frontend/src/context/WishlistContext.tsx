import React, { createContext, useContext, useState, useEffect } from 'react';
import { WishlistItem } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

interface WishlistContextType {
  wishlist: WishlistItem[];
  wishlistIds: Set<string>;
  loading: boolean;
  toggleWishlist: (productId: string) => Promise<boolean>;
  refreshWishlist: () => Promise<void>;
  isWishlisted: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<boolean>(false);

  const refreshWishlist = async () => {
    if (!isAuthenticated) {
      setWishlist([]);
      setWishlistIds(new Set());
      return;
    }
    setLoading(true);
    try {
      const items = await api.getWishlist();
      setWishlist(items);
      setWishlistIds(new Set(items.map((i) => i.product_id)));
    } catch (e) {
      console.error('Failed to load wishlist', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshWishlist();
  }, [isAuthenticated]);

  const toggleWishlist = async (productId: string): Promise<boolean> => {
    if (!isAuthenticated) {
      alert('Please sign in to save items to your wishlist!');
      return false;
    }
    try {
      const res = await api.toggleWishlist(productId);
      await refreshWishlist();
      return res.saved;
    } catch (e) {
      console.error('Failed to toggle wishlist', e);
      return false;
    }
  };

  const isWishlisted = (productId: string) => wishlistIds.has(productId);

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        wishlistIds,
        loading,
        toggleWishlist,
        refreshWishlist,
        isWishlisted,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within a WishlistProvider');
  return ctx;
};
