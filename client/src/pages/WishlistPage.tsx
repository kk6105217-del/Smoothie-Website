import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2, ShoppingCart, ArrowRight } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { StarRating } from '../components/StarRating';

export const WishlistPage: React.FC = () => {
  const { items, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  const handleMoveToCart = async (product: any) => {
    await addToCart(product, 1);
    await removeFromWishlist(product.id || product.product_id);
  };

  if (items.length === 0) {
    return (
      <div className="bg-[#eaeded] min-h-screen py-12 text-center text-left">
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-sm border border-gray-200 space-y-3">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <Heart size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Your Wishlist is empty</h2>
          <p className="text-xs text-gray-500">
            Save items that you want to buy later or use in upcoming robotics and DIY electronics projects.
          </p>
          <Link
            to="/products"
            className="inline-block bg-amber-400 hover:bg-amber-500 text-gray-950 font-bold px-6 py-2.5 rounded text-xs transition"
          >
            Explore Electronics
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#eaeded] min-h-screen py-6 sm:py-8 text-left">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Heart size={22} className="text-red-500 fill-red-500" />
            <span>My Wishlist ({items.length} {items.length === 1 ? 'item' : 'items'})</span>
          </h1>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-200">
          {items.map((prod: any) => {
            const id = prod.id || prod.product_id;
            const price = prod.discounted_price || prod.regular_price || prod.price;
            const isOutOfStock = prod.stock_quantity <= 0;

            return (
              <div key={id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-4 w-full sm:w-auto">
                  <Link
                    to={`/product/${prod.slug}`}
                    className="w-20 h-20 bg-gray-50 rounded border border-gray-200 p-2 shrink-0 flex items-center justify-center"
                  >
                    <img
                      src={prod.image_url || prod.primary_image || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=300&q=80'}
                      alt={prod.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </Link>

                  <div>
                    <Link
                      to={`/product/${prod.slug}`}
                      className="font-semibold text-sm text-gray-900 hover:text-amber-600 line-clamp-2"
                    >
                      {prod.name}
                    </Link>
                    <div className="text-xs text-gray-500 mt-1">
                      SKU: <span className="font-mono">{prod.sku}</span>
                    </div>
                    <div className="text-base font-extrabold text-gray-900 mt-1">
                      ₹{Number(price).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => handleMoveToCart(prod)}
                    disabled={isOutOfStock}
                    className={`px-4 py-2 rounded text-xs font-bold flex items-center space-x-1.5 shadow-sm transition ${
                      isOutOfStock
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-amber-400 hover:bg-amber-500 text-gray-950'
                    }`}
                  >
                    <ShoppingCart size={14} />
                    <span>{isOutOfStock ? 'Out of Stock' : 'Move to Cart'}</span>
                  </button>

                  <button
                    onClick={() => removeFromWishlist(id)}
                    className="p-2 text-gray-400 hover:text-red-600 rounded hover:bg-gray-100 transition"
                    title="Remove from wishlist"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
