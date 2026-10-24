import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Heart, Check, Star, Truck, Zap } from 'lucide-react';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

interface ProductCardProps {
  product: Product;
  dealTag?: string;
  isBestSeller?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, dealTag, isBestSeller }) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const primaryImage =
    product.images && product.images.length > 0
      ? product.images[0].image_url
      : 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80';

  const isSale = product.sale_price && product.sale_price < product.price;
  const currentPriceINR = (isSale ? product.sale_price! : product.price) / 100;
  const originalPriceINR = product.price / 100;
  const discountPercent = isSale
    ? Math.round(((product.price - product.sale_price!) / product.price) * 100)
    : 0;

  const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= product.low_stock_threshold;
  const isOutOfStock = product.stock_quantity <= 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock || adding) return;

    setAdding(true);
    try {
      await addToCart(product.id, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err: any) {
      alert(err.message || 'Could not add to cart');
    } finally {
      setAdding(false);
    }
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleWishlist(product.id);
  };

  const wishlisted = isWishlisted(product.id);

  return (
    <div className="group relative bg-white border border-slate-200/90 rounded-lg overflow-hidden shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col h-full text-slate-900">
      {/* Top Badges */}
      <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1 items-start">
        {isBestSeller && (
          <span className="bg-[#e67a00] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs uppercase tracking-wider">
            #1 Best Seller
          </span>
        )}
        {dealTag ? (
          <span className="bg-[#cc0c39] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs uppercase tracking-wider">
            {dealTag}
          </span>
        ) : discountPercent > 0 ? (
          <span className="bg-[#cc0c39] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
            {discountPercent}% off
          </span>
        ) : null}
      </div>

      {/* Wishlist Button */}
      <button
        onClick={handleToggleWishlist}
        aria-label="Save to Wishlist"
        className={`absolute top-2.5 right-2.5 z-10 p-1.5 rounded-full backdrop-blur-md transition-all shadow-xs ${
          wishlisted
            ? 'bg-rose-50 text-rose-500'
            : 'bg-white/90 text-slate-400 hover:text-rose-500 hover:bg-white'
        }`}
        title="Add to Wishlist"
      >
        <Heart size={16} className={wishlisted ? 'fill-rose-500' : ''} />
      </button>

      {/* Image Area */}
      <Link
        to={`/products/${product.slug}`}
        className="block relative pt-[85%] bg-slate-50/70 overflow-hidden border-b border-slate-100"
      >
        <img
          src={primaryImage}
          alt={product.name}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
        />
        {isOutOfStock && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center">
            <span className="bg-rose-600 text-white text-[11px] font-bold px-2.5 py-1 rounded tracking-wider uppercase">
              Currently Unavailable
            </span>
          </div>
        )}
      </Link>

      {/* Product Information */}
      <div className="p-3.5 flex flex-col flex-grow justify-between text-xs space-y-2">
        <div className="space-y-1.5">
          {/* Category & Brand */}
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span className="font-semibold text-cyan-700 truncate max-w-[70%]">
              {product.category?.name || 'DIY Tech'}
            </span>
            <span className="font-mono text-[10px] text-slate-400">{product.sku}</span>
          </div>

          {/* Title */}
          <Link
            to={`/products/${product.slug}`}
            className="block text-slate-900 font-medium hover:text-[#c45500] transition-colors leading-snug line-clamp-2 min-h-[2.5rem]"
          >
            {product.name}
          </Link>

          {/* Amazon Star Rating */}
          <div className="flex items-center gap-1.5 pt-0.5">
            <div className="flex items-center text-amber-500">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={12}
                  className={star <= 4 ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-300'}
                />
              ))}
            </div>
            <span className="text-[11px] text-slate-600 font-medium">4.8</span>
            <span className="text-[10px] text-slate-400 font-mono">
              ({product.reviews?.length ? product.reviews.length * 7 + 15 : 42})
            </span>
          </div>

          {/* Social Proof */}
          <p className="text-[10px] text-slate-500 font-sans">
            <span className="font-semibold text-slate-700">200+ bought</span> in past month
          </p>
        </div>

        {/* Pricing & Delivery */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          {/* Price Block */}
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs font-semibold text-slate-900">₹</span>
              <span className="text-xl font-bold text-slate-900 font-sans tracking-tight">
                {currentPriceINR.toLocaleString('en-IN')}
              </span>
              {isSale && (
                <span className="text-xs text-slate-500 line-through font-sans">
                  M.R.P: ₹{originalPriceINR.toLocaleString('en-IN')}
                </span>
              )}
            </div>
            {discountPercent > 0 && (
              <span className="text-[10px] font-semibold text-[#cc0c39] block">
                Save ₹{(originalPriceINR - currentPriceINR).toLocaleString('en-IN')} ({discountPercent}% off)
              </span>
            )}
          </div>

          {/* Delivery & Stock Tag */}
          <div className="space-y-0.5 text-[11px]">
            <p className="text-slate-600 flex items-center gap-1">
              <Truck size={12} className="text-slate-500 flex-shrink-0" />
              <span>
                FREE delivery <span className="font-bold text-slate-900">Tomorrow</span> on ₹999+
              </span>
            </p>
            {isLowStock ? (
              <p className="text-[#b12704] font-semibold text-[10px]">
                Only {product.stock_quantity} left in stock - order soon.
              </p>
            ) : isOutOfStock ? (
              <p className="text-rose-600 font-semibold text-[10px]">Out of stock.</p>
            ) : (
              <p className="text-[#007600] font-medium text-[10px]">In stock</p>
            )}
          </div>

          {/* Amazon-style Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock || adding}
            className={`w-full py-1.5 px-3 rounded-full text-xs font-medium transition-all shadow-xs flex items-center justify-center gap-1.5 ${
              isOutOfStock
                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                : added
                ? 'bg-emerald-600 text-white border border-emerald-700'
                : 'bg-[#ffd814] hover:bg-[#f7ca00] active:bg-[#f0b800] text-[#0f1111] border border-[#fcd200]'
            }`}
          >
            {added ? (
              <>
                <Check size={14} /> Added to Cart
              </>
            ) : (
              <>
                <ShoppingCart size={14} /> Add to Cart
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
