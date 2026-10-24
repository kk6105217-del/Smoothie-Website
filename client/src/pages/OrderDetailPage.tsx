import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Package,
  Printer,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  ChevronLeft
} from 'lucide-react';
import { api } from '../services/api';
import { Order } from '../types';
import { getOrderStatusBadge } from './OrdersPage';

const STATUS_STEPS = [
  'Confirmed',
  'Processing',
  'Packed',
  'Shipped',
  'Out for Delivery',
  'Delivered'
];

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    api.orders.getById(id)
      .then(res => setOrder(res.order))
      .catch(err => setErrorMsg(err.message || 'Failed to load order'))
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white p-6 rounded-lg border border-gray-200 animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4" />
          <div className="h-32 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (errorMsg || !order) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white p-6 rounded-lg border border-gray-200 text-center space-y-3">
        <AlertCircle size={36} className="text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-gray-900">Order Not Accessible</h2>
        <p className="text-xs text-gray-500">{errorMsg || 'Order not found.'}</p>
        <Link to="/orders" className="inline-block bg-amber-400 font-bold px-4 py-2 rounded text-xs">
          Back to Orders
        </Link>
      </div>
    );
  }

  // Calculate timeline active step
  const currentStepIndex = STATUS_STEPS.indexOf(order.order_status);

  return (
    <div className="bg-[#eaeded] min-h-screen py-6 sm:py-8 text-left">
      <div className="max-w-4xl mx-auto px-4 space-y-4">
        {/* Breadcrumb */}
        <div className="flex items-center justify-between text-xs">
          <Link to="/orders" className="text-vk-blue hover:underline flex items-center">
            <ChevronLeft size={16} className="mr-0.5" />
            <span>Back to Orders</span>
          </Link>

          <button
            onClick={() => window.print()}
            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-semibold px-3 py-1.5 rounded flex items-center space-x-1 shadow-sm"
          >
            <Printer size={14} />
            <span>Print Invoice</span>
          </button>
        </div>

        {/* Order Header Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <img
                src="/logo.png"
                alt="VK Technology Logo"
                className="w-11 h-11 object-contain rounded-full bg-white p-0.5 border border-gray-200 shadow-sm shrink-0"
              />
              <div>
                <span className="text-base font-black text-gray-900 leading-tight block">VK Technology</span>
                <span className="text-[11px] text-gray-500 block">India</span>
              </div>
            </div>
            <div className="text-right text-xs text-gray-500">
              <span className="font-bold text-gray-800 block text-[11px] uppercase tracking-wider">Tax Invoice</span>
              <span className="text-[10px]">Order Receipt</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-200 gap-2">
            <div>
              <span className="text-xs text-gray-500 block">Order ID</span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 font-mono">
                {order.order_number}
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Placed on {new Date(order.created_at).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            <div className="text-left sm:text-right">
              {getOrderStatusBadge(order.order_status)}
              <span className="block text-xs text-gray-500 mt-1">
                Payment: <strong className="text-gray-800">{order.payment_status}</strong>
              </span>
            </div>
          </div>

          {/* Shipment Tracking Timeline */}
          <div className="py-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-gray-500 mb-4">
              Shipment & Fulfillment Progress
            </h3>

            <div className="relative flex items-center justify-between text-center">
              {/* Connecting bar */}
              <div className="absolute top-4 left-6 right-6 h-1 bg-gray-200 -z-0">
                <div
                  className="h-1 bg-amber-400 transition-all duration-500"
                  style={{
                    width: `${currentStepIndex >= 0 ? (currentStepIndex / (STATUS_STEPS.length - 1)) * 100 : 0}%`
                  }}
                />
              </div>

              {STATUS_STEPS.map((step, idx) => {
                const isDone = currentStepIndex >= idx;
                const isCurrent = currentStepIndex === idx;

                return (
                  <div key={step} className="relative z-10 flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                        isDone
                          ? 'bg-amber-400 text-gray-950 ring-4 ring-amber-100 shadow'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {isDone ? <CheckCircle2 size={16} /> : idx + 1}
                    </div>
                    <span className={`text-[10px] mt-2 font-medium max-w-[70px] leading-tight ${
                      isCurrent ? 'font-bold text-gray-900' : 'text-gray-500'
                    }`}>
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>

            {order.tracking_number && (
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded p-3 text-xs text-blue-900 flex items-center space-x-2">
                <Truck size={16} className="text-blue-600 shrink-0" />
                <span>
                  Tracking Number: <strong className="font-mono">{order.tracking_number}</strong> • Courier partner: Express Cargo / Speed Post
                </span>
              </div>
            )}
          </div>

          {/* Delivery & Payment details grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 text-xs">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-1">
              <strong className="text-gray-900 font-bold block mb-1 flex items-center">
                <MapPin size={14} className="mr-1 text-amber-500" />
                Shipping Address
              </strong>
              <p className="font-semibold text-gray-800">{order.customer_name}</p>
              <p className="text-gray-600">
                {order.shipping_address?.address_line1} {order.shipping_address?.address_line2 || ''}
              </p>
              <p className="text-gray-600">
                {order.shipping_address?.city}, {order.shipping_address?.state} - {order.shipping_address?.postal_code}
              </p>
              <p className="text-gray-600">Phone: {order.customer_phone}</p>
              <p className="text-gray-600">Email: {order.customer_email}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-1">
              <strong className="text-gray-900 font-bold block mb-1 flex items-center">
                <ShieldCheck size={14} className="mr-1 text-emerald-600" />
                Payment & Billing Information
              </strong>
              <p className="text-gray-700">Payment Method: <strong>{order.payment_method === 'upi_qr' ? 'UPI QR Code Payment' : order.payment_method?.toUpperCase()}</strong></p>
              <p className="text-gray-700">Payment Status: <strong>{order.payment_status}</strong></p>
              {order.utr_number && (
                <p className="text-gray-700 font-mono text-[11px] bg-purple-50 p-1.5 rounded border border-purple-200">
                  UPI UTR Reference: <strong>{order.utr_number}</strong>
                </p>
              )}
              {order.razorpay_payment_id && (
                <p className="text-gray-600 font-mono text-[11px]">
                  Transaction Ref: {order.razorpay_payment_id}
                </p>
              )}
              {order.notes && (
                <p className="text-gray-600 mt-2 italic bg-white p-2 rounded border border-gray-200">
                  Note: "{order.notes}"
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Ordered Items Snapshot Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 sm:p-6 space-y-4">
          <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-2">
            Items in this Order ({order.items?.length || 0})
          </h2>

          <div className="divide-y divide-gray-200 text-xs">
            {order.items?.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  {item.product_image ? (
                    <img
                      src={item.product_image}
                      alt={item.product_name}
                      className="w-12 h-12 object-contain bg-gray-50 border rounded p-1 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center text-gray-400">
                      <Package size={20} />
                    </div>
                  )}
                  <div>
                    <strong className="text-gray-900 font-semibold block text-sm">
                      {item.product_name}
                    </strong>
                    <span className="text-gray-500 text-[11px]">SKU: {item.product_sku}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-sm font-bold text-gray-900">
                    ₹{item.total_price?.toLocaleString('en-IN')}
                  </span>
                  <span className="block text-gray-500 text-[11px]">
                    Qty: {item.quantity} × ₹{item.unit_price}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Pricing Totals */}
          <div className="pt-4 border-t border-gray-200 space-y-1 text-xs text-right max-w-xs ml-auto">
            <div className="flex justify-between text-gray-600">
              <span>Items Subtotal:</span>
              <span>₹{order.subtotal?.toLocaleString('en-IN')}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Discount ({order.coupon_code || 'Coupon'}):</span>
                <span>-₹{order.discount_amount?.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>Shipping Charges:</span>
              <span>{order.shipping_fee === 0 ? 'FREE' : `₹${order.shipping_fee}`}</span>
            </div>
            <div className="flex justify-between text-base font-extrabold text-gray-900 pt-2 border-t border-gray-200">
              <span>Total Paid:</span>
              <span className="text-vk-price">₹{order.total_amount?.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
