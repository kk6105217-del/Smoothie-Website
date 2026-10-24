import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Trash2,
  Heart,
  ShoppingCart,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Tag,
  AlertCircle
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    items,
    subtotal,
    count,
    appliedCoupon,
    discountAmount,
    shippingFee,
    totalAmount,
    updateQuantity,
    removeFromCart,
    clearCart,
    applyCoupon,
    removeCoupon
  } = useCart();

  const { toggleWishlist } = useWishlist();

  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const freeShippingThreshold = 999;
  const freeShippingDifference = Math.max(0, freeShippingThreshold - subtotal);
  const freeShippingProgress = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    setCouponSuccess('');
    if (!couponCode.trim()) return;

    try {
      setApplyingCoupon(true);
      await applyCoupon(couponCode.trim());
      setCouponSuccess(`Coupon code "${couponCode.trim().toUpperCase()}" applied successfully!`);
      setCouponCode('');
    } catch (err: any) {
      setCouponError(err.message || 'Invalid or expired coupon code.');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleMoveToWishlist = async (item: any) => {
    await toggleWishlist({
      id: item.product_id,
      name: item.name,
      slug: item.slug,
      sku: item.sku,
      regular_price: item.regular_price,
      discounted_price: item.discounted_price,
      stock_quantity: item.stock_quantity,
      category_id: 1,
      description: '',
      is_featured: 0,
      is_active: 1,
      rating_avg: 4.8,
      rating_count: 1
    });
    await removeFromCart(item.product_id);
  };

  if (items.length === 0) {
    return (
      <div className="bg-[#eaeded] min-h-screen py-8 sm:py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white p-8 sm:p-12 rounded-lg shadow-sm border border-gray-200 text-center space-y-4">
            <div className="w-20 h-20 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
              <ShoppingCart size={40} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Your Shopping Cart is empty</h2>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Explore our range of Arduino boards, sensors, drone kits, and robotics components to start building your DIY project today.
            </p>
            <div className="pt-2">
              <Link
                to="/products"
                className="inline-flex items-center space-x-2 bg-amber-400 hover:bg-amber-500 text-gray-950 font-bold px-6 py-3 rounded-md text-sm shadow transition"
              >
                <span>Continue Shopping</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#eaeded] min-h-screen py-4 sm:py-6 text-left">
      <div className="max-w-[1400px] mx-auto px-2 sm:px-4">
        {/* Free Shipping Notification Bar */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
          {freeShippingDifference === 0 ? (
            <div className="flex items-center text-xs font-bold text-emerald-800 space-x-2">
              <CheckCircle2 size={18} className="text-emerald-600" />
              <span>Congratulations! Your order qualifies for <strong>FREE Delivery</strong> across India.</span>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-semibold text-gray-800">
                <span>
                  Add <strong className="text-vk-price">₹{freeShippingDifference.toFixed(2)}</strong> more of eligible items to your order for <strong>FREE Delivery</strong>
                </span>
                <span className="text-gray-500">{Math.round(freeShippingProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-amber-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${freeShippingProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Cart Main Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Items List (8 cols) */}
          <div className="lg:col-span-8 bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Shopping Cart ({count} {count === 1 ? 'item' : 'items'})
              </h1>
              <button
                onClick={clearCart}
                className="text-xs text-red-600 hover:underline font-semibold"
              >
                Clear Cart
              </button>
            </div>

            {/* Cart Items Table */}
            <div className="divide-y divide-gray-200">
              {items.map((item) => (
                <div key={item.product_id} className="py-4 flex flex-col sm:flex-row gap-4">
                  {/* Thumbnail */}
                  <Link
                    to={`/product/${item.slug}`}
                    className="w-24 h-24 sm:w-28 sm:h-28 bg-gray-50 rounded border border-gray-200 p-2 shrink-0 flex items-center justify-center self-center sm:self-start"
                  >
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </Link>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <Link
                          to={`/product/${item.slug}`}
                          className="font-semibold text-sm text-gray-900 hover:text-amber-600 leading-snug line-clamp-2"
                        >
                          {item.name}
                        </Link>
                        <div className="text-right shrink-0">
                          <span className="text-base font-bold text-gray-900">
                            ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                          </span>
                          {item.quantity > 1 && (
                            <span className="block text-[11px] text-gray-500">
                              (₹{item.price} each)
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-xs text-gray-500 mt-1">
                        SKU: <span className="font-mono text-gray-700">{item.sku}</span>
                      </div>

                      {/* Stock availability */}
                      <span className="text-xs text-vk-stockGreen font-medium block mt-1">
                        In Stock ({item.stock_quantity} available)
                      </span>
                    </div>

                    {/* Quantity Controls & Delete */}
                    <div className="flex flex-wrap items-center gap-3 mt-3 pt-2 border-t border-gray-100 text-xs">
                      {/* Qty Box */}
                      <div className="flex items-center border border-gray-300 rounded overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                          className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 font-bold text-gray-700 transition"
                        >
                          -
                        </button>
                        <span className="px-3 py-1 font-bold text-gray-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                          disabled={item.quantity >= item.stock_quantity}
                          className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 font-bold text-gray-700 transition disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>

                      <span className="text-gray-300">|</span>

                      <button
                        onClick={() => removeFromCart(item.product_id)}
                        className="text-red-600 hover:underline flex items-center space-x-1"
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
                      </button>

                      <span className="text-gray-300">|</span>

                      <button
                        onClick={() => handleMoveToWishlist(item)}
                        className="text-vk-blue hover:underline flex items-center space-x-1"
                      >
                        <Heart size={13} />
                        <span>Save for later</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Subtotal Footer */}
            <div className="text-right pt-4 border-t border-gray-200 text-sm">
              <span>Subtotal ({count} items): </span>
              <strong className="text-base text-gray-900 font-extrabold">
                ₹{subtotal.toLocaleString('en-IN')}
              </strong>
            </div>
          </div>

          {/* Right Summary Column (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Order Summary Box */}
            <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 space-y-4">
              <h3 className="font-bold text-base text-gray-900 border-b border-gray-100 pb-2">
                Order Summary
              </h3>

              <div className="space-y-2 text-xs text-gray-700">
                <div className="flex justify-between">
                  <span>Items Subtotal:</span>
                  <span className="font-semibold text-gray-900">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-700 font-semibold bg-emerald-50 p-2 rounded border border-emerald-200">
                    <div>
                      <span>Coupon ({appliedCoupon.code}):</span>
                      <button
                        onClick={removeCoupon}
                        className="block text-[10px] text-red-600 hover:underline font-normal"
                      >
                        Remove
                      </button>
                    </div>
                    <span>-₹{discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Estimated Shipping:</span>
                  <span>
                    {shippingFee === 0 ? (
                      <strong className="text-emerald-700">FREE</strong>
                    ) : (
                      `₹${shippingFee}`
                    )}
                  </span>
                </div>

                <div className="border-t border-gray-200 pt-3 flex justify-between text-base font-extrabold text-gray-900">
                  <span>Order Total:</span>
                  <span className="text-vk-price">
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Proceed to checkout button */}
              <button
                onClick={() => navigate('/checkout')}
                className="w-full bg-amber-400 hover:bg-amber-500 text-gray-950 font-bold py-3 rounded-md text-xs sm:text-sm shadow transition flex items-center justify-center space-x-2 active:scale-95"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight size={16} />
              </button>

              <div className="text-[11px] text-gray-500 text-center flex items-center justify-center space-x-1.5">
                <ShieldCheck size={14} className="text-emerald-600" />
                <span>Safe & Secure Checkout via Razorpay & COD</span>
              </div>
            </div>

            {/* Apply Coupon Box */}
            <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 space-y-3">
              <div className="flex items-center space-x-2 text-xs font-bold text-gray-800">
                <Tag size={16} className="text-amber-500" />
                <span>Have a Promotional Coupon?</span>
              </div>

              {couponSuccess && (
                <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-2 rounded text-xs">
                  {couponSuccess}
                </div>
              )}

              {couponError && (
                <div className="bg-red-50 border border-red-300 text-red-800 p-2 rounded text-xs">
                  {couponError}
                </div>
              )}

              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter coupon code (e.g. WELCOMEVK)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-amber-500 uppercase"
                />
                <button
                  type="submit"
                  disabled={applyingCoupon}
                  className="bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-800 font-bold px-3 py-2 rounded text-xs transition disabled:opacity-50"
                >
                  {applyingCoupon ? '...' : 'Apply'}
                </button>
              </form>

              <div className="text-[10px] text-gray-500">
                Available codes: <strong className="text-amber-700">WELCOMEVK</strong> (10% off), <strong className="text-amber-700">FREESHIP</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
