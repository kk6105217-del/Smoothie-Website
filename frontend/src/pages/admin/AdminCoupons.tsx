import React, { useEffect, useState } from 'react';
import { Coupon } from '../../types';
import { api } from '../../services/api';
import { FiPlus, FiTag, FiTrash2, FiEdit2, FiCheck, FiX, FiRefreshCw } from 'react-icons/fi';

export const AdminCoupons: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'PERCENT' as 'PERCENT' | 'FIXED',
    discount_value: 10, // 10% or Rs 100
    minimum_order_rupees: 500,
    usage_limit: 100,
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: '',
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.admin.listCoupons();
      setCoupons(res);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch coupons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const openCreateModal = () => {
    setEditingCoupon(null);
    setFormData({
      code: '',
      description: '',
      discount_type: 'PERCENT',
      discount_value: 10,
      minimum_order_rupees: 499,
      usage_limit: 500,
      valid_from: new Date().toISOString().split('T')[0],
      valid_until: '',
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description || '',
      discount_type: coupon.discount_type,
      discount_value:
        coupon.discount_type === 'FIXED'
          ? Math.round(coupon.discount_value / 100)
          : coupon.discount_value,
      minimum_order_rupees: Math.round(coupon.minimum_order / 100),
      usage_limit: coupon.usage_limit,
      valid_from: coupon.valid_from ? coupon.valid_from.split('T')[0] : '',
      valid_until: coupon.valid_until ? coupon.valid_until.split('T')[0] : '',
      is_active: coupon.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      setError('Coupon code is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        code: formData.code.toUpperCase().trim(),
        description: formData.description.trim() || undefined,
        discount_type: formData.discount_type,
        discount_value:
          formData.discount_type === 'FIXED'
            ? Math.round(formData.discount_value * 100) // Convert to paise
            : formData.discount_value,
        minimum_order: Math.round(formData.minimum_order_rupees * 100), // Convert to paise
        usage_limit: formData.usage_limit,
        valid_from: formData.valid_from ? new Date(formData.valid_from).toISOString() : new Date().toISOString(),
        valid_until: formData.valid_until ? new Date(formData.valid_until).toISOString() : undefined,
        is_active: formData.is_active,
      };

      if (editingCoupon) {
        await api.admin.updateCoupon(editingCoupon.id, payload);
        setSuccess(`Coupon ${payload.code} updated.`);
      } else {
        await api.admin.createCoupon(payload);
        setSuccess(`Coupon ${payload.code} created.`);
      }

      setIsModalOpen(false);
      fetchCoupons();
    } catch (err: any) {
      setError(err.message || 'Failed to save coupon');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (coupon: Coupon) => {
    if (!window.confirm(`Delete coupon "${coupon.code}"?`)) return;
    try {
      await api.admin.deleteCoupon(coupon.id);
      setSuccess(`Coupon ${coupon.code} deleted.`);
      fetchCoupons();
    } catch (err: any) {
      setError(err.message || 'Failed to delete coupon');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coupons & Offers</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create promotional codes, percentage discounts, minimum cart thresholds, and redemptions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchCoupons}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            title="Refresh"
          >
            <FiRefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition"
          >
            <FiPlus className="w-5 h-5" />
            Add Coupon
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

      {/* Coupons Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Coupon Code</th>
                <th className="py-3 px-4">Benefit</th>
                <th className="py-3 px-4">Min. Spend</th>
                <th className="py-3 px-4 text-center">Usage Limit</th>
                <th className="py-3 px-4">Validity</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    <FiRefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary-600" />
                    Loading coupons...
                  </td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    <FiTag className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                    No promotional coupons found.
                  </td>
                </tr>
              ) : (
                coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-primary-600 text-base">{c.code}</div>
                      {c.description && <div className="text-xs text-gray-500 mt-0.5">{c.description}</div>}
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-900">
                      {c.discount_type === 'PERCENT' ? `${c.discount_value}% OFF` : `₹${(c.discount_value / 100).toFixed(2)} OFF`}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      ₹{(c.minimum_order / 100).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-bold text-gray-900">{c.times_used}</span> / {c.usage_limit}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500">
                      <div>From: {new Date(c.valid_from).toLocaleDateString('en-IN')}</div>
                      {c.valid_until && <div>Until: {new Date(c.valid_until).toLocaleDateString('en-IN')}</div>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          c.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {c.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(c)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                        title="Edit"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(c)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                        title="Delete"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Coupon Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. MAKER10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="10% discount for first-time DIY enthusiasts"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                  <select
                    value={formData.discount_type}
                    onChange={(e) =>
                      setFormData({ ...formData, discount_type: e.target.value as 'PERCENT' | 'FIXED' })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  >
                    <option value="PERCENT">Percentage (%)</option>
                    <option value="FIXED">Flat INR (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Value {formData.discount_type === 'PERCENT' ? '(%)' : '(₹)'} *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Spend (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minimum_order_rupees}
                    onChange={(e) =>
                      setFormData({ ...formData, minimum_order_rupees: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Usage Limit</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.usage_limit}
                    onChange={(e) => setFormData({ ...formData, usage_limit: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valid From</label>
                  <input
                    type="date"
                    value={formData.valid_from}
                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
                  <input
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none text-sm"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Coupon Active and Redeemable</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium shadow-sm transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
