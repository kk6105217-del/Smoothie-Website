import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Truck, CheckCircle2, Clock, AlertCircle, ExternalLink } from 'lucide-react';
import { Order } from '../types';
import { api } from '../services/api';

export const OrderTracking: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialOrder = searchParams.get('order') || '';

  const [orderQuery, setOrderQuery] = useState(initialOrder);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const trackingSteps = [
    { key: 'CONFIRMED', label: 'Order Confirmed' },
    { key: 'PROCESSING', label: 'Processing' },
    { key: 'PACKED', label: 'Ready for Dispatch' },
    { key: 'SHIPPED', label: 'Shipped' },
    { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
    { key: 'DELIVERED', label: 'Delivered' },
  ];

  const fetchTracking = async (number: string) => {
    if (!number.trim()) return;
    setLoading(true);
    setErrorNotice(null);
    try {
      const o = await api.getOrder(number.trim());
      setOrder(o);
    } catch (err: any) {
      setErrorNotice(err.message || 'Order could not be found. Please verify the order number.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialOrder) {
      fetchTracking(initialOrder);
    }
  }, [initialOrder]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderQuery.trim()) {
      setSearchParams({ order: orderQuery.trim() });
      fetchTracking(orderQuery.trim());
    }
  };

  const getStepIndex = (status: string) => {
    if (status === 'PENDING') return 0;
    const idx = trackingSteps.findIndex((s) => s.key === status);
    return idx >= 0 ? idx + 1 : 1;
  };

  const currentStep = order ? getStepIndex(order.status) : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="text-center max-w-xl mx-auto space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center justify-center gap-2">
          <Truck size={28} className="text-cyan-600" />
          Track Your Shipment
        </h1>
        <p className="text-xs text-slate-500">
          Enter your DIY Tech Projects order number (e.g. DIY-20261013-ABCD) to check real-time delivery status.
        </p>

        {/* Search Input */}
        <form onSubmit={handleSearch} className="flex gap-2 pt-4">
          <input
            type="text"
            required
            placeholder="Enter Order Number"
            value={orderQuery}
            onChange={(e) => setOrderQuery(e.target.value.toUpperCase())}
            className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-xs"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-slate-900 hover:bg-cyan-600 text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
          >
            {loading ? 'Searching...' : 'Track'}
          </button>
        </form>
      </div>

      {errorNotice && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
          <AlertCircle size={18} className="flex-shrink-0" />
          <span>{errorNotice}</span>
        </div>
      )}

      {order && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <span className="text-xs text-slate-400 font-mono">ORDER IDENTIFIER</span>
              <h3 className="text-lg font-bold text-slate-900 font-mono">{order.order_number}</h3>
            </div>
            <div className="text-right sm:text-right">
              <span className="text-xs text-slate-400">Order Placed</span>
              <p className="text-xs font-semibold text-slate-800">
                {new Date(order.created_at).toLocaleDateString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>

          {/* Stepper Timeline */}
          <div className="py-6">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center">
              {trackingSteps.map((step, idx) => {
                const isPassed = currentStep > idx;
                const isCurrent = currentStep === idx + 1;

                return (
                  <div key={step.key} className="flex flex-col items-center space-y-2">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-colors shadow-xs ${
                        isPassed
                          ? 'bg-emerald-600 text-white'
                          : isCurrent
                          ? 'bg-cyan-600 text-white ring-4 ring-cyan-100'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {isPassed ? <CheckCircle2 size={18} /> : idx + 1}
                    </div>
                    <span
                      className={`text-xs font-medium leading-tight ${
                        isCurrent
                          ? 'text-cyan-700 font-bold'
                          : isPassed
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Shipment Carrier Details */}
          {order.shipments && order.shipments.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
              <h4 className="font-bold text-xs uppercase font-mono text-slate-900 flex items-center gap-2">
                <Truck size={16} className="text-cyan-600" />
                Courier & Waybill Tracking
              </h4>
              {order.shipments.map((s) => (
                <div key={s.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="text-slate-500">Carrier:</span>{' '}
                    <strong className="text-slate-900">{s.carrier}</strong>
                    <span className="mx-2 text-slate-300">|</span>
                    <span className="text-slate-500">AWB Tracking Number:</span>{' '}
                    <strong className="text-slate-900 font-mono">{s.tracking_number}</strong>
                  </div>
                  {s.tracking_url && (
                    <a
                      href={s.tracking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-bold text-cyan-700 hover:underline"
                    >
                      <span>View on Courier Website</span>
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Address Snapshot */}
          <div className="text-xs text-slate-600 border-t border-slate-100 pt-5">
            <span className="font-bold text-slate-900 uppercase font-mono block mb-1">
              Destination
            </span>
            <p>
              {order.address_snapshot.recipient_name} — {order.address_snapshot.city},{' '}
              {order.address_snapshot.state} ({order.address_snapshot.pincode})
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
