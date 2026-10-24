import React, { useEffect, useState } from 'react';
import { CustomerSummary } from '../../types';
import { api } from '../../services/api';
import { FiUsers, FiSearch, FiMail, FiPhone, FiShoppingBag, FiRefreshCw, FiCalendar } from 'react-icons/fi';

export const AdminCustomers: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.admin.listCustomers();
      setCustomers(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filtered = customers.filter((c) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term) ||
      (c.phone && c.phone.includes(term))
    );
  });

  const totalRegistered = customers.length;
  const totalLifetimeSpentPaise = customers.reduce((sum, c) => sum + (c.total_spent_paise || 0), 0);
  const totalOrdersPlaced = customers.reduce((sum, c) => sum + (c.orders_count || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Registered makers, order histories, and lifetime spending.
          </p>
        </div>
        <button
          onClick={fetchCustomers}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
          title="Refresh"
        >
          <FiRefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-xs font-semibold text-gray-500 uppercase">Registered Makers</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{totalRegistered}</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-xs font-semibold text-gray-500 uppercase">Total Orders By Registered Makers</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{totalOrdersPlaced}</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-xs font-semibold text-gray-500 uppercase">Registered Makers Lifetime Spend</div>
          <div className="text-2xl font-bold text-primary-600 mt-1">
            ₹{(totalLifetimeSpentPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center">
        <div className="relative w-full max-w-md">
          <FiSearch className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search makers by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Maker Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Joined Date</th>
                <th className="py-3 px-4 text-center">Orders</th>
                <th className="py-3 px-4 text-right">Lifetime Spend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    <FiRefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary-600" />
                    Loading customers...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    <FiUsers className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                    No customers found matching search.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-900">{c.name}</div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <FiMail className="text-gray-400 w-3.5 h-3.5" />
                        <span>{c.email}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {c.phone ? (
                        <div className="flex items-center gap-1.5">
                          <FiPhone className="text-gray-400 w-3.5 h-3.5" />
                          <span>{c.phone}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs">
                      <div className="flex items-center gap-1.5">
                        <FiCalendar className="text-gray-400 w-3.5 h-3.5" />
                        <span>{new Date(c.created_at).toLocaleDateString('en-IN')}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                        <FiShoppingBag className="w-3 h-3" />
                        {c.orders_count}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-gray-900">
                      ₹{(c.total_spent_paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
