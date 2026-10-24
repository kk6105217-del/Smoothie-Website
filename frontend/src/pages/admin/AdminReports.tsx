import React, { useEffect, useState } from 'react';
import { SalesReport } from '../../types';
import { api } from '../../services/api';
import { FiTrendingUp, FiShoppingBag, FiDollarSign, FiCalendar, FiRefreshCw, FiPieChart } from 'react-icons/fi';

export const AdminReports: React.FC = () => {
  const [days, setDays] = useState(30);
  const [report, setReport] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.admin.getSalesReport(days);
      setReport(res);
    } catch (err: any) {
      setError(err.message || 'Failed to generate sales report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [days]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Sales Reports</h1>
          <p className="text-sm text-gray-500 mt-1">
            Financial performance, order velocity, Average Order Value (AOV), and payment breakdowns.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-lg border border-gray-300 p-1 bg-white">
            <button
              onClick={() => setDays(7)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                days === 7 ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setDays(30)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                days === 30 ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setDays(90)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                days === 90 ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Last 90 Days
            </button>
          </div>
          <button
            onClick={fetchReport}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            title="Refresh"
          >
            <FiRefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Gross Sales</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <FiDollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-gray-900 mt-2">
            ₹{report ? ((report.total_revenue_paise || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
          </div>
          <p className="text-xs text-gray-500 mt-1">Across all confirmed & delivered orders</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Orders</span>
            <div className="p-2 bg-primary-50 text-primary-600 rounded-lg">
              <FiShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-gray-900 mt-2">
            {report?.total_orders || 0}
          </div>
          <p className="text-xs text-gray-500 mt-1">Purchases initiated in this timeframe</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Average Order Value (AOV)</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <FiTrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-purple-700 mt-2">
            ₹{report ? ((report.average_order_value_paise || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
          </div>
          <p className="text-xs text-gray-500 mt-1">Average basket size per maker</p>
        </div>
      </div>

      {/* Breakdown Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Method Split */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FiPieChart className="text-primary-600" /> Payment Method Volume
          </h2>
          {report?.by_payment_method && Object.keys(report.by_payment_method).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(report.by_payment_method).map(([method, count]) => {
                const total = report.total_orders || 1;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={method} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold text-gray-800">
                        {method === 'ONLINE' ? 'Online Payment (Razorpay / UPI / Cards)' : 'Cash on Delivery (COD)'}
                      </span>
                      <span className="font-mono text-gray-600">
                        {count} orders ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-2.5 rounded-full ${method === 'ONLINE' ? 'bg-primary-600' : 'bg-amber-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-sm text-gray-500 py-6 text-center">No orders recorded in this period.</div>
          )}
        </div>

        {/* Order Fulfilment Status Breakdown */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FiShoppingBag className="text-primary-600" /> Order Fulfilment Breakdown
          </h2>
          {report?.by_status && Object.keys(report.by_status).length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(report.by_status).map(([status, count]) => (
                <div key={status} className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-600 uppercase">{status}</span>
                  <span className="font-mono font-bold text-gray-900 text-sm">{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500 py-6 text-center">No status data available.</div>
          )}
        </div>
      </div>

      {/* Daily Sales Trend Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
            <FiCalendar className="text-primary-600" /> Daily Sales Trend ({report?.period || `${days} days`})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-center">Orders</th>
                <th className="py-3 px-4 text-right">Daily Revenue (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!report?.by_date || report.by_date.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-gray-500">
                    No sales recorded in this interval.
                  </td>
                </tr>
              ) : (
                report.by_date.map((d) => (
                  <tr key={d.date} className="hover:bg-gray-50 transition">
                    <td className="py-3 px-4 font-mono text-gray-700">{d.date}</td>
                    <td className="py-3 px-4 text-center font-bold text-gray-900">{d.orders}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600">
                      ₹{(d.revenue_paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
