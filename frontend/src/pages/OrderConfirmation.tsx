import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Package, Truck, ArrowRight, Printer } from 'lucide-react';
import { Order } from '../types';
import { api } from '../services/api';

export const OrderConfirmation: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      if (!orderNumber) return;
      try {
        const o = await api.getOrder(orderNumber);
        setOrder(o);
      } catch (err) {
        console.error('Failed to load order', err);
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 flex justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Order Not Found</h2>
        <Link to="/shop" className="text-cyan-600 font-semibold underline text-sm">
          Return to Store
        </Link>
      </div>
    );
  }

  const addr = order.address_snapshot;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Success Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 sm:p-8 text-center space-y-3">
        <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
          <CheckCircle size={36} />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Order Successfully Placed!
        </h1>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          Thank you for shopping with VK Technology. We have dispatched a confirmation alert to your email and phone.
        </p>
        <div className="inline-block bg-white px-4 py-1.5 rounded-lg border border-emerald-200 font-mono font-bold text-slate-900 text-sm">
          Order #{order.order_number}
        </div>
      </div>

      {/* Order Details Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs text-slate-500">Order Status</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-100 text-cyan-800">
                {order.status}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800 font-mono">
                Payment: {order.payment_method} ({order.payment_status})
              </span>
            </div>
          </div>
          <button
            onClick={() => window.print()}
            className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 px-3 py-1.5 rounded-lg"
          >
            <Printer size={14} /> Print Receipt
          </button>
        </div>

        {/* Address & Delivery */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-slate-600">
          <div>
            <h4 className="font-bold text-slate-900 uppercase font-mono mb-2">Delivery Address</h4>
            <p className="font-semibold text-slate-800">{addr.recipient_name}</p>
            <p>{addr.address_line1}</p>
            {addr.address_line2 && <p>{addr.address_line2}</p>}
            <p>
              {addr.city}, {addr.state} - {addr.pincode}
            </p>
            <p className="font-mono mt-1">Phone: {addr.phone}</p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 uppercase font-mono mb-2">Shipment Status</h4>
            <p className="text-slate-700">Estimated dispatch within 24 hours.</p>
            <p className="text-slate-700 mt-1">Carrier tracking will be updated upon dispatch.</p>
            <Link
              to={`/track-order?order=${order.order_number}`}
              className="inline-flex items-center gap-1.5 mt-3 text-cyan-700 hover:text-cyan-800 font-bold underline"
            >
              <Truck size={14} /> Track Order Live →
            </Link>
          </div>
        </div>

        {/* Itemised Breakdown */}
        <div className="border-t border-slate-100 pt-6 space-y-3">
          <h4 className="font-bold text-xs uppercase font-mono text-slate-900">Purchased Hardware</h4>
          <div className="divide-y divide-slate-100">
            {order.items.map((it) => (
              <div key={it.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-900 block">{it.name_snapshot}</span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    SKU: {it.sku_snapshot} | Qty: {it.quantity}
                  </span>
                </div>
                <span className="font-mono font-bold text-slate-900">
                  ₹{(it.line_total_paise / 100).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="border-t border-slate-200 pt-4 space-y-1.5 text-xs text-slate-600 text-right">
          <p>Subtotal: <span className="font-mono text-slate-900">₹{(order.subtotal_paise / 100).toLocaleString('en-IN')}</span></p>
          {order.discount_paise > 0 && (
            <p className="text-emerald-600 font-semibold">
              Discount: <span className="font-mono">-₹{(order.discount_paise / 100).toLocaleString('en-IN')}</span>
            </p>
          )}
          <p>Shipping: <span className="font-mono text-slate-900">{order.shipping_paise === 0 ? 'FREE' : `₹${order.shipping_paise / 100}`}</span></p>
          <p>Tax (18% GST): <span className="font-mono text-slate-900">₹{(order.tax_paise / 100).toLocaleString('en-IN')}</span></p>
          <p className="text-base font-black text-slate-900 font-mono pt-2 border-t border-slate-100">
            Total Paid/Payable: ₹{(order.total_paise / 100).toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      <div className="flex justify-center gap-4">
        <Link
          to="/shop"
          className="px-6 py-3 bg-slate-900 hover:bg-cyan-600 text-white font-bold rounded-xl text-sm transition-colors shadow-sm flex items-center gap-2"
        >
          <span>Continue Shopping</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
};
