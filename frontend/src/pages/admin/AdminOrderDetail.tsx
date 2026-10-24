import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Order } from '../../types';
import { api } from '../../services/api';
import { Badge } from '../../components/common/Badge';
import {
  FiArrowLeft,
  FiTruck,
  FiPackage,
  FiCheckCircle,
  FiDollarSign,
  FiMapPin,
  FiAlertTriangle,
  FiPrinter,
  FiRefreshCw,
  FiPlus,
  FiX,
} from 'react-icons/fi';

export const AdminOrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Status transition state
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [statusNotes, setStatusNotes] = useState<string>('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Shipment modal state
  const [isShipmentModalOpen, setIsShipmentModalOpen] = useState(false);
  const [carrier, setCarrier] = useState('Delhivery');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [savingShipment, setSavingShipment] = useState(false);

  const fetchOrder = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.admin.getOrder(id);
      setOrder(res);
      setSelectedStatus(res.status);
    } catch (err: any) {
      setError(err.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    try {
      setUpdatingStatus(true);
      setError(null);
      const updated = await api.admin.updateOrderStatus(order.id, {
        status: selectedStatus,
        notes: statusNotes || undefined,
      });
      setOrder(updated);
      setSuccess(`Order status transitioned to ${selectedStatus}.`);
      setStatusNotes('');
    } catch (err: any) {
      setError(err.message || 'Failed to update order status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleMarkCodCollected = async () => {
    if (!order) return;
    try {
      setUpdatingStatus(true);
      setError(null);
      const updated = await api.admin.updateOrderStatus(order.id, {
        status: order.status,
        cod_collected: true,
        notes: 'COD cash collected by courier / store.',
      });
      setOrder(updated);
      setSuccess('COD payment marked as Collected!');
    } catch (err: any) {
      setError(err.message || 'Failed to update COD collection');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !carrier.trim() || !trackingNumber.trim()) return;
    try {
      setSavingShipment(true);
      setError(null);
      const updated = await api.admin.addShipment(order.id, {
        carrier: carrier.trim(),
        tracking_number: trackingNumber.trim(),
        tracking_url: trackingUrl.trim() || undefined,
        status: 'SHIPPED',
      });
      setOrder(updated);
      setSuccess('Shipment tracking added and customer notified!');
      setIsShipmentModalOpen(false);
      setTrackingNumber('');
      setTrackingUrl('');
    } catch (err: any) {
      setError(err.message || 'Failed to add shipment tracking');
    } finally {
      setSavingShipment(false);
    }
  };

  if (loading && !order) {
    return (
      <div className="py-20 text-center">
        <FiRefreshCw className="w-8 h-8 animate-spin mx-auto text-primary-600 mb-2" />
        <p className="text-gray-500">Loading order details...</p>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700">
        <h2 className="font-bold text-lg mb-2">Error Loading Order</h2>
        <p className="mb-4">{error}</p>
        <Link to="/admin/orders" className="text-primary-600 hover:underline inline-flex items-center gap-1 font-medium">
          <FiArrowLeft /> Back to Orders
        </Link>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/orders"
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition text-gray-600"
            title="Back to Orders"
          >
            <FiArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 font-mono">{order.order_number}</h1>
              <Badge status={order.status} />
              <Badge status={order.payment_status} />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Placed on {new Date(order.created_at).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
          >
            <FiPrinter className="w-4 h-4" />
            Print Packing Slip
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)}><FiX className="w-5 h-5" /></button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)}><FiX className="w-5 h-5" /></button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Items, Shipments, Reasons */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <FiPackage className="text-primary-600" /> Order Items ({order.items?.length || 0})
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {order.items?.map((item) => (
                <div key={item.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition">
                  {item.image_url_snapshot ? (
                    <img
                      src={item.image_url_snapshot}
                      alt={item.name_snapshot}
                      className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                      <FiPackage className="w-6 h-6" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">{item.name_snapshot}</h3>
                    <div className="text-xs text-gray-500 font-mono mt-0.5">SKU: {item.sku_snapshot}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      Qty: <span className="font-bold text-gray-900">{item.quantity}</span> × ₹
                      {(item.unit_price_paise / 100).toFixed(2)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">
                      ₹{(item.line_total_paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[11px] text-gray-400">
                      Incl. Tax: ₹{(item.tax_amount_paise / 100).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Courier Shipments & Tracking */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <FiTruck className="text-primary-600" /> Shipments & Courier Tracking
              </h2>
              <button
                onClick={() => setIsShipmentModalOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-lg font-medium transition"
              >
                <FiPlus className="w-3.5 h-3.5" />
                Add Shipment / AWB
              </button>
            </div>

            {(!order.shipments || order.shipments.length === 0) ? (
              <div className="p-4 bg-gray-50 rounded-lg text-center text-sm text-gray-500">
                No tracking numbers added yet. Click "Add Shipment / AWB" when dispatched.
              </div>
            ) : (
              <div className="space-y-3">
                {order.shipments.map((ship) => (
                  <div key={ship.id} className="p-3 border border-gray-200 rounded-lg flex items-center justify-between bg-gray-50">
                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{ship.carrier}</div>
                      <div className="font-mono font-bold text-gray-900 text-sm mt-0.5">{ship.tracking_number}</div>
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        Shipped: {new Date(ship.shipped_at).toLocaleDateString('en-IN')}
                      </div>
                    </div>
                    <div>
                      {ship.tracking_url ? (
                        <a
                          href={ship.tracking_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-primary-600 hover:underline font-medium"
                        >
                          Track on Courier Website →
                        </a>
                      ) : (
                        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                          {ship.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cancellation or Return Reason if any */}
          {(order.cancellation_reason || order.return_reason) && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm">
                <FiAlertTriangle /> Policy Action Notes
              </div>
              {order.cancellation_reason && (
                <p className="text-sm text-amber-900">
                  <span className="font-medium">Cancellation Reason:</span> {order.cancellation_reason}
                </p>
              )}
              {order.return_reason && (
                <p className="text-sm text-amber-900">
                  <span className="font-medium">Return Reason:</span> {order.return_reason}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Status Actions, Address, Payment, Totals */}
        <div className="space-y-6">
          {/* Fulfilment Status Transition */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FiCheckCircle className="text-primary-600" /> Update Order Status
            </h2>
            <form onSubmit={handleStatusUpdate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Fulfilment Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="PROCESSING">PROCESSING</option>
                  <option value="PACKED">PACKED</option>
                  <option value="SHIPPED">SHIPPED</option>
                  <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="CANCELLED">CANCELLED (Restocks Inventory)</option>
                  <option value="RETURN_REQUESTED">RETURN_REQUESTED</option>
                  <option value="RETURNED">RETURNED</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status Transition Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Dispatched via BlueDart AWB#123"
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={updatingStatus || selectedStatus === order.status}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 rounded-lg text-sm transition disabled:opacity-50"
              >
                {updatingStatus ? 'Updating...' : 'Update Status'}
              </button>
            </form>

            {/* COD Collection Action */}
            {order.payment_method === 'COD' && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-700">COD Collection Status</span>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded ${
                      order.cod_collected ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {order.cod_collected ? 'COLLECTED' : 'PENDING'}
                  </span>
                </div>
                {!order.cod_collected && (
                  <button
                    onClick={handleMarkCodCollected}
                    disabled={updatingStatus}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 rounded-lg text-xs transition disabled:opacity-50"
                  >
                    Mark Cash Collected (₹{(order.total_paise / 100).toFixed(2)})
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Customer & Address Snapshot */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FiMapPin className="text-primary-600" /> Delivery Address
            </h2>
            <div className="text-sm text-gray-700 space-y-1">
              <div className="font-bold text-gray-900">{order.address_snapshot?.recipient_name}</div>
              <div>{order.address_snapshot?.phone}</div>
              <div>{order.address_snapshot?.address_line1}</div>
              {order.address_snapshot?.address_line2 && <div>{order.address_snapshot.address_line2}</div>}
              <div>
                {order.address_snapshot?.city}, {order.address_snapshot?.state} - {order.address_snapshot?.pincode}
              </div>
              <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                Email: {order.guest_email || 'Linked to account'}
              </div>
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FiDollarSign className="text-primary-600" /> Payment & Financials
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>₹{(order.subtotal_paise / 100).toFixed(2)}</span>
              </div>
              {order.discount_paise > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({order.coupon_code || 'Promo'})</span>
                  <span>-₹{(order.discount_paise / 100).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Shipping Charges</span>
                <span>
                  {order.shipping_paise === 0 ? 'FREE' : `₹${(order.shipping_paise / 100).toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax (GST)</span>
                <span>₹{(order.tax_paise / 100).toFixed(2)}</span>
              </div>
              <div className="pt-2 border-t border-gray-200 flex justify-between font-bold text-gray-900 text-base">
                <span>Grand Total</span>
                <span>₹{(order.total_paise / 100).toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Records */}
            {order.payments && order.payments.length > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500 space-y-1">
                <div className="font-semibold text-gray-700">Payment Gateway Log:</div>
                {order.payments.map((p) => (
                  <div key={p.id} className="bg-gray-50 p-2 rounded border border-gray-100">
                    <div>Gateway: <span className="font-mono text-gray-800">{p.gateway}</span></div>
                    {p.gateway_payment_id && <div>Pay ID: <span className="font-mono text-gray-800">{p.gateway_payment_id}</span></div>}
                    <div>Status: <span className="font-bold text-gray-800">{p.status}</span></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Shipment Modal */}
      {isShipmentModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add Courier Shipment Tracking</h2>
            <form onSubmit={handleAddShipment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Courier / Carrier *</label>
                <input
                  type="text"
                  required
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  placeholder="e.g. Delhivery, BlueDart, DTDC, India Post"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">AWB / Tracking Number *</label>
                <input
                  type="text"
                  required
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. DL123456789IN"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tracking URL (Optional)</label>
                <input
                  type="url"
                  value={trackingUrl}
                  onChange={(e) => setTrackingUrl(e.target.value)}
                  placeholder="https://www.delhivery.com/track/package/..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsShipmentModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingShipment}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium shadow-sm transition disabled:opacity-50"
                >
                  {savingShipment ? 'Saving...' : 'Save & Notify Maker'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
