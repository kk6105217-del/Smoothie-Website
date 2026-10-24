import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { FiSave, FiSettings, FiDollarSign, FiTruck, FiBell, FiCheck, FiX, FiRefreshCw } from 'react-icons/fi';

export const AdminSettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    store_name: 'VK Technology – DIY Tech Projects',
    contact_email: 'karthik.suroju@gmail.com',
    contact_phone: '+91 8555997052',
    whatsapp_number: '+91 8555997052',
    default_shipping_rupees: 70,
    free_shipping_threshold_rupees: 999,
    tax_rate_percent: 18,
    cod_enabled: true,
    cod_max_limit_rupees: 25000,
    return_window_days: 7,
    email_notifications_enabled: true,
    whatsapp_notifications_enabled: true,
    sms_notifications_enabled: true,
  });

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getSettings();
      setFormData({
        store_name: res.store_name,
        contact_email: res.contact_email,
        contact_phone: res.contact_phone,
        whatsapp_number: res.whatsapp_number,
        default_shipping_rupees: Math.round(res.default_shipping_paise / 100),
        free_shipping_threshold_rupees: Math.round(res.free_shipping_threshold_paise / 100),
        tax_rate_percent: res.tax_rate_percent,
        cod_enabled: res.cod_enabled,
        cod_max_limit_rupees: Math.round(res.cod_max_limit_paise / 100),
        return_window_days: res.return_window_days,
        email_notifications_enabled: res.email_notifications_enabled,
        whatsapp_notifications_enabled: res.whatsapp_notifications_enabled,
        sms_notifications_enabled: res.sms_notifications_enabled,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const payload: Record<string, string> = {
        store_name: formData.store_name,
        contact_email: formData.contact_email,
        contact_phone: formData.contact_phone,
        whatsapp_number: formData.whatsapp_number,
        default_shipping_paise: String(formData.default_shipping_rupees * 100),
        free_shipping_threshold_paise: String(formData.free_shipping_threshold_rupees * 100),
        tax_rate_percent: String(formData.tax_rate_percent),
        cod_enabled: String(formData.cod_enabled),
        cod_max_limit_paise: String(formData.cod_max_limit_rupees * 100),
        return_window_days: String(formData.return_window_days),
        email_notifications_enabled: String(formData.email_notifications_enabled),
        whatsapp_notifications_enabled: String(formData.whatsapp_notifications_enabled),
        sms_notifications_enabled: String(formData.sms_notifications_enabled),
      };

      await api.admin.updateSettings(payload);
      setSuccess('Store configuration updated successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <FiRefreshCw className="w-8 h-8 animate-spin mx-auto text-primary-600 mb-2" />
        <p className="text-gray-500">Loading store settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Store Settings & Configuration</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure business details, shipping thresholds, GST tax rates, Cash on Delivery limits, and notification integrations.
        </p>
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Business Profile */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
            <FiSettings className="text-primary-600" /> Business Contact & Identity
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
              <input
                type="text"
                required
                value={formData.store_name}
                onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Support Email</label>
              <input
                type="email"
                required
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Support Phone</label>
              <input
                type="text"
                required
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Support Number</label>
              <input
                type="text"
                required
                value={formData.whatsapp_number}
                onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Shipping & Tax Rules */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
            <FiTruck className="text-primary-600" /> Shipping & Tax Rules
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Standard Delivery Fee (₹)</label>
              <input
                type="number"
                min="0"
                value={formData.default_shipping_rupees}
                onChange={(e) => setFormData({ ...formData, default_shipping_rupees: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Free Shipping Threshold (₹)</label>
              <input
                type="number"
                min="0"
                value={formData.free_shipping_threshold_rupees}
                onChange={(e) =>
                  setFormData({ ...formData, free_shipping_threshold_rupees: parseInt(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GST Tax Rate (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={formData.tax_rate_percent}
                onChange={(e) => setFormData({ ...formData, tax_rate_percent: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none font-bold"
              />
            </div>
          </div>
        </div>

        {/* Cash on Delivery & Return Policy */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
            <FiDollarSign className="text-primary-600" /> Cash on Delivery & Return Windows
          </h2>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="cod_enabled"
                checked={formData.cod_enabled}
                onChange={(e) => setFormData({ ...formData, cod_enabled: e.target.checked })}
                className="w-5 h-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
              />
              <label htmlFor="cod_enabled" className="text-sm font-medium text-gray-800 cursor-pointer">
                Enable Cash on Delivery (COD) Payment Option
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max COD Order Value (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.cod_max_limit_rupees}
                  onChange={(e) => setFormData({ ...formData, cod_max_limit_rupees: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Orders exceeding this total must pay online via Razorpay/UPI.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Return Request Window (Days)</label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={formData.return_window_days}
                  onChange={(e) => setFormData({ ...formData, return_window_days: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Makers can submit return requests within this number of days post-delivery.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Multi-Channel Notification Dispatch */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
            <FiBell className="text-primary-600" /> Automated Notification Channels
          </h2>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.email_notifications_enabled}
                onChange={(e) => setFormData({ ...formData, email_notifications_enabled: e.target.checked })}
                className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
              />
              <div>
                <div className="text-sm font-semibold text-gray-800">Email Notifications (Resend / AWS SES)</div>
                <div className="text-xs text-gray-500">Order confirmations, payment receipts, shipment tracking links.</div>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.whatsapp_notifications_enabled}
                onChange={(e) => setFormData({ ...formData, whatsapp_notifications_enabled: e.target.checked })}
                className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
              />
              <div>
                <div className="text-sm font-semibold text-gray-800">WhatsApp Messaging (Meta Cloud API)</div>
                <div className="text-xs text-gray-500">Instant WhatsApp order placed, packing updates, and courier out-for-delivery alerts.</div>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.sms_notifications_enabled}
                onChange={(e) => setFormData({ ...formData, sms_notifications_enabled: e.target.checked })}
                className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
              />
              <div>
                <div className="text-sm font-semibold text-gray-800">SMS Notifications (Twilio / Msg91)</div>
                <div className="text-xs text-gray-500">Transactional SMS dispatch for order confirmation and OTP/tracking.</div>
              </div>
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium px-6 py-2.5 rounded-lg shadow-sm transition disabled:opacity-50"
          >
            <FiSave className="w-5 h-5" />
            {saving ? 'Saving Changes...' : 'Save Store Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};
