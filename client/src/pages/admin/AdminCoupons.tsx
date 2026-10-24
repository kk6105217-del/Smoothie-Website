import React, { useState, useEffect } from 'react';
import { Tag, Plus, Edit, Trash2, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { api } from '../../services/api';
import { Coupon } from '../../types';

export const AdminCoupons: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<number | string>('');
  const [minOrderValue, setMinOrderValue] = useState<number | string>(0);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<number | string>('');
  const [usageLimit, setUsageLimit] = useState<number | string>('');
  const [expiryDate, setExpiryDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    try {
      setIsLoading(true);
      const res = await api.coupons.getAdminAll();
      setCoupons(res.coupons || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingCoupon(null);
    setCode('');
    setDescription('');
    setDiscountType('percentage');
    setDiscountValue(10);
    setMinOrderValue(499);
    setMaxDiscountAmount(250);
    setUsageLimit(500);
    setExpiryDate('');
    setIsActive(true);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (c: Coupon) => {
    setEditingCoupon(c);
    setCode(c.code);
    setDescription(c.description || '');
    setDiscountType(c.discount_type);
    setDiscountValue(c.discount_value);
    setMinOrderValue(c.min_order_value || 0);
    setMaxDiscountAmount(c.max_discount_amount || '');
    setUsageLimit(c.usage_limit || '');
    setExpiryDate(c.expiry_date ? c.expiry_date.slice(0, 10) : '');
    setIsActive(!!c.is_active);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!code || !discountValue) {
      setErrorMsg('Coupon code and discount value are required.');
      return;
    }

    const payload = {
      code: code.trim().toUpperCase(),
      description: description.trim() || undefined,
      discount_type: discountType,
      discount_value: Number(discountValue),
      min_order_value: Number(minOrderValue || 0),
      max_discount_amount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
      usage_limit: usageLimit ? Number(usageLimit) : null,
      expiry_date: expiryDate || null,
      is_active: isActive
    };

    try {
      if (editingCoupon) {
        await api.coupons.update(editingCoupon.id, payload);
      } else {
        await api.coupons.create(payload);
      }
      setIsModalOpen(false);
      await loadCoupons();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save coupon');
    }
  };

  const handleDelete = async (id: number, couponCode: string) => {
    if (window.confirm(`Delete coupon "${couponCode}"?`)) {
      try {
        await api.coupons.delete(id);
        await loadCoupons();
      } catch (e: any) {
        alert(e.message || 'Delete failed');
      }
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-200 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coupons & Promotional Discounts</h1>
          <p className="text-xs text-gray-500">
            Create promotional coupon codes for student project sales, seasonal campaigns, and first-time users.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-amber-400 hover:bg-amber-500 text-gray-950 font-bold px-4 py-2 rounded text-xs shadow flex items-center space-x-1.5 transition"
        >
          <Plus size={16} />
          <span>Create New Coupon</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Coupon Code</th>
                <th className="py-3 px-3">Discount Type & Value</th>
                <th className="py-3 px-3">Min Order Value</th>
                <th className="py-3 px-3">Redemptions</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {coupons.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition">
                  <td className="py-3 px-4">
                    <span className="font-mono font-bold text-sm text-gray-900 bg-amber-50 border border-amber-300 px-2.5 py-0.5 rounded inline-block">
                      {c.code}
                    </span>
                    {c.description && <span className="block text-[11px] text-gray-500 mt-1">{c.description}</span>}
                  </td>

                  <td className="py-3 px-3">
                    <strong className="text-gray-900 block font-semibold">
                      {c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `₹${c.discount_value} FLAT OFF`}
                    </strong>
                    {c.max_discount_amount && (
                      <span className="text-[10px] text-gray-400">Max cap: ₹{c.max_discount_amount}</span>
                    )}
                  </td>

                  <td className="py-3 px-3 text-gray-700">
                    ₹{c.min_order_value || 0}
                  </td>

                  <td className="py-3 px-3 font-mono text-gray-600">
                    {c.times_used || 0} {c.usage_limit ? `/ ${c.usage_limit}` : 'uses'}
                  </td>

                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      c.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {c.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => openEditModal(c)}
                      className="p-1 text-gray-600 hover:text-amber-600"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(c.id, c.code)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 text-xs space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-2 border-b border-gray-200">
              <h3 className="font-bold text-sm text-gray-900">
                {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X size={18} className="text-gray-400 hover:text-gray-700" />
              </button>
            </div>

            {errorMsg && (
              <div className="bg-red-50 text-red-800 p-2 rounded border border-red-200">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveCoupon} className="space-y-3">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Coupon Code (Uppercase) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WELCOMEVK"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs font-mono font-bold uppercase"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. 10% off for first-time engineering students"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={(e: any) => setDiscountType(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs bg-white font-bold"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Discount Value *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 10 or 150"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Min Order Value (₹)</label>
                  <input
                    type="number"
                    value={minOrderValue}
                    onChange={(e) => setMinOrderValue(e.target.value)}
                    placeholder="499"
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Max Cap Amount (₹)</label>
                  <input
                    type="number"
                    value={maxDiscountAmount}
                    onChange={(e) => setMaxDiscountAmount(e.target.value)}
                    placeholder="250"
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Usage Limit Count</label>
                  <input
                    type="number"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                    placeholder="500"
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs"
                  />
                </div>
              </div>

              <label className="flex items-center space-x-2 pt-1 cursor-pointer font-bold">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded text-amber-500"
                />
                <span>Active & Redeemable at Checkout</span>
              </label>

              <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-400 hover:bg-amber-500 text-gray-950 font-bold px-4 py-2 rounded shadow-sm"
                >
                  Save Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
