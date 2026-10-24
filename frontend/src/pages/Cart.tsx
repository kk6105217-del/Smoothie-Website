import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Trash2,
  ArrowRight,
  ShoppingBag,
  Tag,
  CheckCircle2,
  AlertCircle,
  Truck,
  ArrowLeft,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { api } from '../services/api';

export const Cart: React.FC = () => {
  const navigate = useNavigate();
  const { cart, updateQuantity, removeItem, loading } = useCart();

  const [couponCode, setCouponCode] = useState('');
  const [couponDiscountPaise, setCouponDiscountPaise] = useState(0);
  const [couponMessage, setCouponMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const subtotalPaise = cart?.subtotal_paise || 0;
  const freeShippingThresholdPaise = 99900; // ₹999
  const remainingForFreeShipping = Math.max(0, freeShippingThresholdPaise - subtotalPaise);
  const freeShippingPercent = Math.min(100, Math.round((subtotalPaise / freeShippingThresholdPaise) * 100));

  const shippingPaise = subtotalPaise >= freeShippingThresholdPaise || subtotalPaise === 0 ? 0 : 7000;
  const taxablePaise = Math.max(0, subtotalPaise - couponDiscountPaise);
  const taxPaise = Math.round(taxablePaise * 0.18);
  const totalPaise = taxablePaise + shippingPaise + taxPaise;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setApplyingCoupon(true);
    setCouponMessage(null);
    try {
      const res = await api.applyCoupon(couponCode.trim(), subtotalPaise);
      if (res.is_valid) {
        setCouponDiscountPaise(res.discount_paise);
        setCouponMessage({ text: res.message, isError: false });
      } else {
        setCouponDiscountPaise(0);
        setCouponMessage({ text: res.message, isError: true });
      }
    } catch (err: any) {
      setCouponMessage({ text: err.message || 'Invalid coupon', isError: true });
      setCouponDiscountPaise(0);
    } finally {
      setApplyingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setCouponCode('');
    setCouponDiscountPaise(0);
    setCouponMessage(null);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 flex justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-5">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
          <ShoppingBag size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Your Cart is Empty</h2>
        <p className="text-sm text-slate-600 max-w-sm mx-auto">
          Explore our robotics kits, IoT sensors, and Arduino development boards to start building.
        </p>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-cyan-600 text-white font-bold rounded-xl text-sm transition-colors shadow-sm"
        >
          <span>Continue Shopping</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Shopping Cart ({cart.total_items} items)
        </h1>
        <Link to="/shop" className="text-xs font-semibold text-cyan-700 hover:underline flex items-center gap-1">
          <ArrowLeft size={14} /> Continue Shopping
        </Link>
      </div>

      {/* Free Shipping Progress Indicator */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-800 flex items-center gap-1.5">
            <Truck size={16} className="text-cyan-600" />
            {remainingForFreeShipping === 0 ? (
              <span className="text-emerald-600 font-bold">🎉 You unlocked FREE Shipping!</span>
            ) : (
              <span>
                Add <strong className="text-slate-900 font-mono">₹{(remainingForFreeShipping / 100).toFixed(0)}</strong> more for FREE express shipping!
              </span>
            )}
          </span>
          <span className="text-slate-500 font-mono text-[11px]">{freeShippingPercent}%</span>
        </div>
        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              freeShippingPercent >= 100 ? 'bg-emerald-500' : 'bg-cyan-500'
            }`}
            style={{ width: `${freeShippingPercent}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Cart Items List */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 shadow-xs">
            {cart.items.map((item) => {
              const prod = item.product;
              const img =
                prod.images && prod.images.length > 0
                  ? prod.images[0].image_url
                  : 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80';
              const unitPriceINR =
                (prod.sale_price && prod.sale_price < prod.price ? prod.sale_price : prod.price) / 100;

              return (
                <div key={item.id} className="p-4 sm:p-5 flex gap-4 items-center justify-between">
                  {/* Thumbnail */}
                  <Link
                    to={`/products/${prod.slug}`}
                    className="w-20 h-20 bg-slate-100 rounded-xl overflow-hidden flex-shrink-0 border border-slate-200"
                  >
                    <img src={img} alt={prod.name} className="w-full h-full object-cover" />
                  </Link>

                  {/* Details */}
                  <div className="flex-1 min-w-0 pr-2">
                    <span className="text-[11px] font-mono text-slate-400 block">{prod.sku}</span>
                    <Link
                      to={`/products/${prod.slug}`}
                      className="font-semibold text-sm text-slate-900 hover:text-cyan-700 line-clamp-1"
                    >
                      {prod.name}
                    </Link>
                    <span className="text-xs font-mono text-slate-600 block mt-1">
                      ₹{unitPriceINR.toLocaleString('en-IN')} each
                    </span>
                  </div>

                  {/* Quantity Controller */}
                  <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                    <button
                      type="button"
                      disabled={item.quantity <= 1}
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 disabled:opacity-30 text-xs font-bold"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-xs font-bold font-mono text-slate-900">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      disabled={item.quantity >= prod.stock_quantity}
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 disabled:opacity-30 text-xs font-bold"
                    >
                      +
                    </button>
                  </div>

                  {/* Line Total */}
                  <div className="text-right w-24">
                    <span className="font-bold text-sm text-slate-900 font-mono block">
                      ₹{(item.line_total_paise / 100).toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                    title="Remove item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Coupon Code Form */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-mono flex items-center gap-2">
              <Tag size={16} className="text-cyan-600" />
              Promotional Coupons
            </h3>

            {couponDiscountPaise > 0 ? (
              <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="flex items-center gap-2 text-xs text-emerald-800 font-semibold">
                  <CheckCircle2 size={16} />
                  <span>Coupon '{couponCode}' applied (-₹{(couponDiscountPaise / 100).toFixed(0)})</span>
                </div>
                <button
                  type="button"
                  onClick={removeCoupon}
                  className="text-xs text-rose-600 hover:underline font-bold"
                >
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter code (e.g. MAKER10)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs uppercase font-mono font-bold focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
                <button
                  type="submit"
                  disabled={applyingCoupon || !couponCode.trim()}
                  className="px-4 py-2 bg-slate-900 hover:bg-cyan-600 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                >
                  {applyingCoupon ? 'Checking...' : 'Apply Code'}
                </button>
              </form>
            )}

            {couponMessage && (
              <p
                className={`text-xs flex items-center gap-1 ${
                  couponMessage.isError ? 'text-rose-600' : 'text-emerald-600 font-medium'
                }`}
              >
                {couponMessage.isError && <AlertCircle size={14} />}
                {couponMessage.text}
              </p>
            )}
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5 sticky top-28">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Order Summary
            </h2>

            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-mono text-slate-900 font-semibold">
                  ₹{(subtotalPaise / 100).toLocaleString('en-IN')}
                </span>
              </div>

              {couponDiscountPaise > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Coupon Discount</span>
                  <span className="font-mono">-₹{(couponDiscountPaise / 100).toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Estimated Shipping</span>
                <span className="font-mono text-slate-900 font-semibold">
                  {shippingPaise === 0 ? (
                    <span className="text-emerald-600 font-bold uppercase">Free</span>
                  ) : (
                    `₹${(shippingPaise / 100).toFixed(0)}`
                  )}
                </span>
              </div>

              <div className="flex justify-between">
                <span>GST (18% Included)</span>
                <span className="font-mono text-slate-900 font-semibold">
                  ₹{(taxPaise / 100).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline text-sm">
                <span className="font-bold text-slate-900">Total Amount</span>
                <span className="font-black text-xl text-slate-900 font-mono">
                  ₹{(totalPaise / 100).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/checkout')}
              className="w-full py-3.5 px-4 bg-slate-900 hover:bg-cyan-600 text-white font-bold rounded-xl text-sm transition-colors shadow-md flex items-center justify-center gap-2"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight size={18} />
            </button>

            <p className="text-[11px] text-slate-400 text-center">
              🔒 256-Bit SSL Encrypted Checkout. Authoritative prices re-verified by server.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
