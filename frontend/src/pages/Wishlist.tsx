import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, ArrowRight } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { ProductCard } from '../components/common/ProductCard';

export const Wishlist: React.FC = () => {
  const { wishlist, loading } = useWishlist();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 flex justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
            <Heart size={24} className="text-rose-500 fill-rose-500" />
            My Wishlist ({wishlist.length})
          </h1>
          <p className="text-xs text-slate-500 mt-1">Saved products for your upcoming technology builds.</p>
        </div>
        <Link to="/shop" className="text-xs font-semibold text-cyan-700 hover:underline">
          Explore More Components →
        </Link>
      </div>

      {wishlist.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center space-y-4 max-w-md mx-auto">
          <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-400">
            <Heart size={32} />
          </div>
          <h3 className="text-base font-bold text-slate-900">Your wishlist is currently empty</h3>
          <p className="text-xs text-slate-500">
            Click the heart icon on any product card or details page to bookmark it for later.
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-cyan-600 transition-colors shadow-sm"
          >
            <span>Browse Products</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {wishlist.map((item) => (
            <ProductCard key={item.id} product={item.product} />
          ))}
        </div>
      )}
    </div>
  );
};
