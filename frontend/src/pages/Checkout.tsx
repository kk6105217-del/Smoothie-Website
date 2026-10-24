import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  CreditCard,
  Banknote,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Truck,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { QuoteResponse } from '../types';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { cart, refreshCart } = useCart();
  const { user, isAuthenticated } = useAuth();

  // Form fields
  const [recipientName, setRecipientName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Karnataka');
  const [pincode, setPincode] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<'ONLINE' | 'COD'>('ONLINE');
  const [notes, setNotes] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(true);

  // Authoritative server quote
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Fetch server quote whenever items or pincode changes
  useEffect(() => {
    async function fetchQuote() {
      if (!cart || cart.items.length === 0) return;
      setLoadingQuote(true);
      setErrorNotice(null);
      try {
        const items = cart.items.map((i) => ({ product_id: i.product_id, quantity: i.quantity }));
        const q = await api.getQuote({
          items,
          pincode: pincode.length === 6 ? pincode : undefined,
        });
        setQuote(q);
      } catch (err: any) {
        setErrorNotice(err.message || 'Could not calculate authoritative price');
      } finally {
        setLoadingQuote(false);
      }
    }
    fetchQuote();
  }, [cart, pincode]);

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Your Cart is Empty</h2>
        <p className="text-sm text-slate-600">Please add products to your cart before proceeding to checkout.</p>
        <Link to="/shop" className="inline-block px-5 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-semibold">
          Browse Products
        </Link>
      </div>
    );
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorNotice(null);

    if (!recipientName || !phone || !addressLine1 || !city || !state || !pincode) {
      setErrorNotice('Please fill in all mandatory delivery address fields.');
      return;
    }
    if (pincode.length !== 6 || !/^\d+$/.test(pincode)) {
      setErrorNotice('Please enter a valid 6-digit Indian PIN code.');
      return;
    }
    if (!acceptedTerms) {
      setErrorNotice('You must accept the store policies to complete checkout.');
      return;
    }

    setSubmittingOrder(true);

    try {
      const items = cart.items.map((i) => ({ product_id: i.product_id, quantity: i.quantity }));
      const orderPayload = {
        items,
        shipping_address: {
          recipient_name: recipientName.trim(),
          phone: phone.trim(),
          address_line1: addressLine1.trim(),
          address_line2: addressLine2.trim() || undefined,
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
        },
        payment_method: paymentMethod,
        notes: notes.trim() || undefined,
        guest_name: recipientName.trim(),
        guest_email: email.trim() || undefined,
        guest_phone: phone.trim(),
      };

      const res = await api.createOrder(orderPayload);
      const placedOrder = res.order;
      const gatewayData = res.gateway_data;

      if (paymentMethod === 'COD') {
        // Direct COD Confirmation
        await refreshCart();
        navigate(`/order-confirmation/${placedOrder.order_number}`);
      } else {
        // Online Payment Flow (Razorpay / Sandbox simulation)
        // If razorpay script not loaded or in mock sandbox:
        const simulatedMock = window.confirm(
          `[Razorpay Payment Sandbox]\n\nAuthorize Payment of ₹${(placedOrder.total_paise / 100).toFixed(
            2
          )} for Order #${placedOrder.order_number}?\n\nClick OK to simulate successful payment, or Cancel to simulate failure.`
        );

        if (simulatedMock) {
          // Verify on backend
          await api.verifyPayment({
            order_id: placedOrder.id,
            gateway_order_id: gatewayData?.id || 'order_mock_test',
            gateway_payment_id: 'pay_mock_' + Math.random().toString(36).substring(2),
            gateway_signature: 'signature_verified_mock',
          });
          await refreshCart();
          navigate(`/order-confirmation/${placedOrder.order_number}`);
        } else {
          setErrorNotice('Payment was cancelled by the user. You can retry payment below.');
        }
      }
    } catch (err: any) {
      setErrorNotice(err.message || 'Failed to place order');
    } finally {
      setSubmittingOrder(false);
    }
  };

  const statesList = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
    'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
    'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
    'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi',
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
          <Lock size={24} className="text-cyan-600" />
          Secure Checkout
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Complete delivery details and select payment method.
        </p>
      </div>

      {errorNotice && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
          <AlertCircle size={18} className="flex-shrink-0" />
          <span>{errorNotice}</span>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Delivery Address & Payment Method */}
        <div className="lg:col-span-8 space-y-8">
          {/* 1. Contact & Shipping Address */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Truck size={18} className="text-cyan-600" />
              1. Delivery Address (India Only)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mobile Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Email Address (For Order Tracking & Invoices) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="ramesh@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Address Line 1 (Flat, House No., Building) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. #402, Ramanuja Apartments, 2nd Cross"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Address Line 2 (Street, Landmark, Area)
                </label>
                <input
                  type="text"
                  placeholder="Near Tech Park, HSR Layout"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  City <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bengaluru"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  State <span className="text-rose-500">*</span>
                </label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  {statesList.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  PIN Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="560100"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Order Delivery Instructions (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Leave with security / call upon arrival"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* 2. Payment Method Selection */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <CreditCard size={18} className="text-cyan-600" />
              2. Select Payment Option
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Online Payment (Razorpay) */}
              <label
                className={`p-4 rounded-xl border-2 flex items-start gap-3.5 cursor-pointer transition-all ${
                  paymentMethod === 'ONLINE'
                    ? 'border-cyan-500 bg-cyan-50/40 ring-1 ring-cyan-500'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="ONLINE"
                  checked={paymentMethod === 'ONLINE'}
                  onChange={() => setPaymentMethod('ONLINE')}
                  className="mt-1 text-cyan-600 focus:ring-cyan-500"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">Online Payment</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-100 text-cyan-800">
                      Recommended
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards, NetBanking via Razorpay.
                  </p>
                </div>
              </label>

              {/* Cash on Delivery (COD) */}
              <label
                className={`p-4 rounded-xl border-2 flex items-start gap-3.5 cursor-pointer transition-all ${
                  paymentMethod === 'COD'
                    ? 'border-cyan-500 bg-cyan-50/40 ring-1 ring-cyan-500'
                    : 'border-slate-200 hover:border-slate-300'
                } ${quote && !quote.is_cod_eligible ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="COD"
                  disabled={quote ? !quote.is_cod_eligible : false}
                  checked={paymentMethod === 'COD'}
                  onChange={() => setPaymentMethod('COD')}
                  className="mt-1 text-cyan-600 focus:ring-cyan-500"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">Cash on Delivery (COD)</span>
                    <Banknote size={16} className="text-slate-500" />
                  </div>
                  <p className="text-xs text-slate-600">
                    Pay in cash or UPI QR upon package arrival to the delivery courier.
                  </p>
                  {quote && !quote.is_cod_eligible && (
                    <span className="text-[11px] text-rose-600 font-semibold block">
                      Not available for this location or order limit.
                    </span>
                  )}
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Authoritative Order Summary */}
        <div className="lg:col-span-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5 sticky top-28">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Review Order Items
            </h2>

            {/* Items mini list */}
            <div className="max-h-52 overflow-y-auto divide-y divide-slate-100 pr-1 space-y-2">
              {cart.items.map((i) => (
                <div key={i.id} className="pt-2 flex items-center justify-between text-xs">
                  <div className="max-w-[70%]">
                    <span className="font-semibold text-slate-800 line-clamp-1">{i.product.name}</span>
                    <span className="text-slate-400 font-mono">Qty: {i.quantity}</span>
                  </div>
                  <span className="font-mono text-slate-900 font-bold">
                    ₹{(i.line_total_paise / 100).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>

            {/* Authoritative Server Quote Breakdown */}
            <div className="space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
              <div className="flex justify-between">
                <span>Verified Subtotal</span>
                <span className="font-mono text-slate-900 font-semibold">
                  ₹{((quote?.subtotal_paise || cart.subtotal_paise) / 100).toLocaleString('en-IN')}
                </span>
              </div>

              {quote && quote.discount_paise > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Coupon ({quote.coupon_code})</span>
                  <span className="font-mono">-₹{(quote.discount_paise / 100).toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Shipping Charges</span>
                <span className="font-mono text-slate-900 font-semibold">
                  {quote?.shipping_paise === 0 ? (
                    <span className="text-emerald-600 font-bold uppercase">Free</span>
                  ) : (
                    `₹${((quote?.shipping_paise || 7000) / 100).toFixed(0)}`
                  )}
                </span>
              </div>

              <div className="flex justify-between">
                <span>GST (18% Included)</span>
                <span className="font-mono text-slate-900 font-semibold">
                  ₹{((quote?.tax_paise || Math.round(cart.subtotal_paise * 0.18)) / 100).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline text-sm">
                <span className="font-bold text-slate-900">Total Payable</span>
                <span className="font-black text-2xl text-slate-900 font-mono">
                  ₹{((quote?.total_paise || cart.subtotal_paise) / 100).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Terms checkbox */}
            <label className="flex items-start gap-2 text-xs text-slate-600 cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
              />
              <span>
                I agree to the{' '}
                <Link to="/policies?tab=terms" className="text-cyan-700 underline" target="_blank">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/policies?tab=returns" className="text-cyan-700 underline" target="_blank">
                  7-Day Return Policy
                </Link>.
              </span>
            </label>

            <button
              type="submit"
              disabled={submittingOrder || loadingQuote}
              className="w-full py-3.5 px-4 bg-slate-900 hover:bg-cyan-600 text-white font-bold rounded-xl text-sm transition-colors shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submittingOrder ? (
                <span>Confirming Order...</span>
              ) : (
                <>
                  <span>Place Order (₹{((quote?.total_paise || cart.subtotal_paise) / 100).toFixed(0)})</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-slate-500 text-center">
              <ShieldCheck size={14} className="text-cyan-600" />
              <span>Razorpay Verified • SSL Secured</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
