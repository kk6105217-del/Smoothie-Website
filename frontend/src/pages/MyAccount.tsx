import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  User as UserIcon,
  Package,
  MapPin,
  Heart,
  Plus,
  Trash2,
  Truck,
  RotateCcw,
  XCircle,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Order, Address } from '../types';

export const MyAccount: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'orders';

  const { user, refreshUser } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  // Address Modal / Form state
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [newAddr, setNewAddr] = useState({
    recipient_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: 'Karnataka',
    pincode: '',
    is_default: false,
  });

  useEffect(() => {
    async function loadOrders() {
      setLoadingOrders(true);
      try {
        const res = await api.listMyOrders();
        setOrders(res.items);
      } catch (err) {
        console.error('Failed to load orders', err);
      } finally {
        setLoadingOrders(false);
      }
    }

    async function loadAddresses() {
      setLoadingAddresses(true);
      try {
        const addrs = await api.listAddresses();
        setAddresses(addrs);
      } catch (err) {
        console.error('Failed to load addresses', err);
      } finally {
        setLoadingAddresses(false);
      }
    }

    loadOrders();
    loadAddresses();
  }, []);

  const handleCancelOrder = async (orderId: string) => {
    const reason = prompt('Please specify the reason for cancellation:');
    if (!reason) return;
    try {
      await api.cancelOrder(orderId, reason);
      alert('Order successfully cancelled. Any applicable refunds are in process.');
      const res = await api.listMyOrders();
      setOrders(res.items);
    } catch (err: any) {
      alert(err.message || 'Failed to cancel order');
    }
  };

  const handleRequestReturn = async (orderId: string) => {
    const reason = prompt('Please describe the issue or reason for return request:');
    if (!reason) return;
    try {
      await api.requestReturn(orderId, reason);
      alert('Return request registered. Our support team will follow up via email/WhatsApp.');
      const res = await api.listMyOrders();
      setOrders(res.items);
    } catch (err: any) {
      alert(err.message || 'Failed to submit return request');
    }
  };

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAddress(newAddr);
      setShowAddressModal(false);
      setNewAddr({
        recipient_name: '',
        phone: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: 'Karnataka',
        pincode: '',
        is_default: false,
      });
      const addrs = await api.listAddresses();
      setAddresses(addrs);
    } catch (err: any) {
      alert(err.message || 'Failed to add address');
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!window.confirm('Delete this saved address?')) return;
    try {
      await api.deleteAddress(id);
      setAddresses(addresses.filter((a) => a.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete address');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Profile Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Welcome, {user?.name || 'Maker'}
          </h1>
          <p className="text-xs text-slate-500 font-mono mt-0.5">{user?.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/wishlist"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Heart size={14} className="text-rose-500" /> View Wishlist
          </Link>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setSearchParams({ tab: 'orders' })}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
            currentTab === 'orders'
              ? 'border-cyan-600 text-cyan-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Package size={16} /> Order History ({orders.length})
        </button>

        <button
          onClick={() => setSearchParams({ tab: 'addresses' })}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
            currentTab === 'addresses'
              ? 'border-cyan-600 text-cyan-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <MapPin size={16} /> Saved Addresses ({addresses.length})
        </button>

        <button
          onClick={() => setSearchParams({ tab: 'profile' })}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
            currentTab === 'profile'
              ? 'border-cyan-600 text-cyan-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <UserIcon size={16} /> Account Profile
        </button>
      </div>

      {/* TAB 1: ORDERS */}
      {currentTab === 'orders' && (
        <div className="space-y-4">
          {loadingOrders ? (
            <div className="py-12 flex justify-center">
              <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
              <Package size={32} className="text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-900 text-sm">No orders placed yet</h3>
              <p className="text-xs text-slate-500">
                Browse our curated tech projects and place your first order.
              </p>
              <Link
                to="/shop"
                className="inline-block mt-2 px-5 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-cyan-600 transition-colors"
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((o) => (
                <div
                  key={o.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[11px] font-mono text-slate-400">ORDER NO.</span>
                      <h4 className="font-bold text-slate-900 text-sm font-mono">{o.order_number}</h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          o.status === 'DELIVERED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : o.status === 'CANCELLED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-cyan-100 text-cyan-800'
                        }`}
                      >
                        {o.status}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        Payment: {o.payment_method} ({o.payment_status})
                      </span>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="divide-y divide-slate-100">
                    {o.items.map((it) => (
                      <div key={it.id} className="py-2 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-semibold text-slate-800">{it.name_snapshot}</span>
                          <span className="text-slate-400 font-mono text-[11px] ml-2">
                            x{it.quantity}
                          </span>
                        </div>
                        <span className="font-mono text-slate-900 font-bold">
                          ₹{(it.line_total_paise / 100).toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Order Footer Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
                    <div className="font-bold text-slate-900">
                      Total: ₹{(o.total_paise / 100).toLocaleString('en-IN')}
                    </div>

                    <div className="flex items-center gap-3">
                      <Link
                        to={`/track-order?order=${o.order_number}`}
                        className="text-cyan-700 hover:underline font-bold flex items-center gap-1"
                      >
                        <Truck size={14} /> Track Status
                      </Link>

                      {['PENDING', 'CONFIRMED', 'PROCESSING'].includes(o.status) && (
                        <button
                          onClick={() => handleCancelOrder(o.id)}
                          className="text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1"
                        >
                          <XCircle size={14} /> Cancel Order
                        </button>
                      )}

                      {o.status === 'DELIVERED' && (
                        <button
                          onClick={() => handleRequestReturn(o.id)}
                          className="text-amber-600 hover:text-amber-700 font-bold flex items-center gap-1"
                        >
                          <RotateCcw size={14} /> Request 7-Day Return
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ADDRESSES */}
      {currentTab === 'addresses' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-900 text-sm">Saved Delivery Addresses</h3>
            <button
              onClick={() => setShowAddressModal(true)}
              className="px-3.5 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-cyan-600 transition-colors flex items-center gap-1.5"
            >
              <Plus size={14} /> Add New Address
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {addresses.map((a) => (
              <div
                key={a.id}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs text-xs space-y-2 relative"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{a.recipient_name}</span>
                  {a.is_default && (
                    <span className="px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 font-semibold text-[10px]">
                      DEFAULT
                    </span>
                  )}
                </div>
                <p className="text-slate-600 leading-relaxed">
                  {a.address_line1}
                  {a.address_line2 ? `, ${a.address_line2}` : ''}
                  <br />
                  {a.city}, {a.state} - {a.pincode}
                </p>
                <p className="font-mono text-slate-700">Phone: {a.phone}</p>
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => handleDeleteAddress(a.id)}
                    className="text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: PROFILE */}
      {currentTab === 'profile' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 max-w-xl space-y-4 text-xs">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">
            Customer Profile Details
          </h3>
          <div className="space-y-3">
            <div>
              <span className="text-slate-400 block mb-0.5">Full Name</span>
              <span className="font-bold text-slate-900 text-sm">{user?.name}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Email Address</span>
              <span className="font-bold text-slate-900 font-mono">{user?.email}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Mobile Hotline</span>
              <span className="font-bold text-slate-900 font-mono">{user?.phone || 'Not provided'}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Account Role</span>
              <span className="font-bold text-cyan-700">{user?.role}</span>
            </div>
          </div>
        </div>
      )}

      {/* Add Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Add New Delivery Address</h3>
            <form onSubmit={handleCreateAddress} className="space-y-3 text-xs">
              <input
                type="text"
                required
                placeholder="Recipient Name"
                value={newAddr.recipient_name}
                onChange={(e) => setNewAddr({ ...newAddr, recipient_name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
              />
              <input
                type="tel"
                required
                placeholder="Phone (+91)"
                value={newAddr.phone}
                onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono"
              />
              <input
                type="text"
                required
                placeholder="Flat / Building Address Line 1"
                value={newAddr.address_line1}
                onChange={(e) => setNewAddr({ ...newAddr, address_line1: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
              />
              <input
                type="text"
                placeholder="Street / Landmark (Line 2)"
                value={newAddr.address_line2}
                onChange={(e) => setNewAddr({ ...newAddr, address_line2: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder="City"
                  value={newAddr.city}
                  onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                  className="bg-slate-50 border border-slate-200 rounded-lg p-2"
                />
                <input
                  type="text"
                  required
                  placeholder="6-digit PIN code"
                  maxLength={6}
                  value={newAddr.pincode}
                  onChange={(e) => setNewAddr({ ...newAddr, pincode: e.target.value })}
                  className="bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 text-white rounded-lg font-bold hover:bg-cyan-600"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
