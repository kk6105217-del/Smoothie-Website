import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package,
  ChevronRight,
  Clock,
  Truck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import { Order } from '../types';
import { useAuth } from '../context/AuthContext';

export function getOrderStatusBadge(status: string) {
  switch (status) {
    case 'Delivered':
      return <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded text-[11px] border border-emerald-300">Delivered</span>;
    case 'Shipped':
    case 'Out for Delivery':
      return <span className="bg-blue-100 text-blue-800 font-bold px-2.5 py-0.5 rounded text-[11px] border border-blue-300">{status}</span>;
    case 'Packed':
    case 'Processing':
    case 'Confirmed':
      return <span className="bg-amber-100 text-amber-800 font-bold px-2.5 py-0.5 rounded text-[11px] border border-amber-300">{status}</span>;
    case 'Cancelled':
      return <span className="bg-red-100 text-red-800 font-bold px-2.5 py-0.5 rounded text-[11px] border border-red-300">Cancelled</span>;
    default:
      return <span className="bg-gray-100 text-gray-800 font-bold px-2.5 py-0.5 rounded text-[11px] border border-gray-300">{status}</span>;
  }
}

export const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/orders');
      return;
    }

    setIsLoading(true);
    api.orders.getMyOrders()
      .then(res => setOrders(res.orders || []))
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false));
  }, [user]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white p-6 rounded-lg border border-gray-200 animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4" />
          <div className="h-24 bg-gray-200 rounded" />
          <div className="h-24 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#eaeded] min-h-screen py-6 sm:py-8 text-left">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Your Orders</h1>
          <Link to="/track" className="text-xs text-vk-blue hover:underline font-semibold flex items-center">
            <span>Track by Order ID</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white p-8 sm:p-12 rounded-lg shadow-sm border border-gray-200 text-center space-y-3">
            <Package size={44} className="text-gray-300 mx-auto" />
            <h3 className="text-lg font-bold text-gray-900">No orders placed yet</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              When you purchase components, robotics kits, or sensors, you can track their status and download invoices here.
            </p>
            <Link
              to="/products"
              className="inline-block bg-amber-400 hover:bg-amber-500 text-gray-950 font-bold px-5 py-2.5 rounded text-xs mt-2"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((ord) => (
              <div
                key={ord.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
              >
                {/* Header row */}
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex flex-wrap items-center justify-between text-xs text-gray-600 gap-2">
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                    <div>
                      <span className="block text-[10px] text-gray-400 uppercase font-bold">Order Placed</span>
                      <strong className="text-gray-800">
                        {new Date(ord.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </strong>
                    </div>

                    <div>
                      <span className="block text-[10px] text-gray-400 uppercase font-bold">Total Amount</span>
                      <strong className="text-gray-900">₹{ord.total_amount?.toLocaleString('en-IN')}</strong>
                    </div>

                    <div>
                      <span className="block text-[10px] text-gray-400 uppercase font-bold">Ship To</span>
                      <span className="text-gray-800 font-semibold">{ord.customer_name}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="block text-[10px] text-gray-400 uppercase font-bold">Order #</span>
                    <strong className="font-mono text-gray-900">{ord.order_number}</strong>
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      {getOrderStatusBadge(ord.order_status)}
                      <span className="text-gray-500">• Payment: {ord.payment_status}</span>
                    </div>
                    {ord.tracking_number && (
                      <p className="text-gray-600">
                        Tracking Number: <strong className="font-mono text-gray-800">{ord.tracking_number}</strong>
                      </p>
                    )}
                    <p className="text-gray-500">
                      Payment Method: <strong>{ord.payment_method?.toUpperCase()}</strong>
                    </p>
                  </div>

                  <div className="flex items-center space-x-3 w-full sm:w-auto">
                    <Link
                      to={`/orders/${ord.id}`}
                      className="flex-1 sm:flex-initial text-center bg-amber-400 hover:bg-amber-500 text-gray-950 font-bold px-4 py-2 rounded shadow-sm text-xs transition"
                    >
                      Track Package & Invoice
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
