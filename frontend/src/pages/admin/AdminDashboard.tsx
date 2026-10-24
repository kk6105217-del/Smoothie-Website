import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  ShoppingBag,
  Clock,
  AlertTriangle,
  Boxes,
  TrendingUp,
  Package,
  Plus,
  ArrowRight,
  Truck,
  CheckCircle,
} from 'lucide-react';
import { DashboardStats } from '../../types';
import { api } from '../../services/api';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const s = await api.admin.getDashboard();
        setStats(s);
      } catch (err) {
        console.error('Failed to load dashboard stats', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-8">
      {/* Title & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Business Overview</h1>
          <p className="text-xs text-slate-500 font-mono mt-0.5">Real-time metrics & inventory telemetry</p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            to="/admin/products/new"
            className="px-4 py-2 bg-slate-900 hover:bg-cyan-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus size={16} /> Add Product
          </Link>
          <Link
            to="/admin/orders"
            className="px-4 py-2 bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 text-xs font-bold rounded-lg transition-colors"
          >
            Manage Orders
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Paid Revenue */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
              Collected Revenue
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            ₹{(stats.paid_revenue_paise / 100).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-400">Strictly verified paid orders</p>
        </div>

        {/* Total Orders */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
              Total Orders
            </span>
            <div className="p-2 rounded-lg bg-cyan-50 text-cyan-600">
              <ShoppingBag size={20} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">{stats.total_orders}</div>
          <p className="text-[11px] text-slate-400">{stats.pending_orders} pending fulfillment</p>
        </div>

        {/* COD Awaiting Collection */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
              COD Awaiting
            </span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Clock size={20} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            ₹{(stats.cod_pending_paise / 100).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-amber-700 font-medium">
            {stats.cod_pending_count} COD orders awaiting courier cash
          </p>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
              Inventory Alert
            </span>
            <div
              className={`p-2 rounded-lg ${
                stats.low_stock_count > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'
              }`}
            >
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">{stats.low_stock_count}</div>
          <p className="text-[11px] text-slate-500">
            {stats.low_stock_count > 0 ? (
              <span className="text-rose-600 font-semibold">Products below threshold</span>
            ) : (
              <span>All catalog stocks healthy</span>
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Orders Table */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm">Recent Store Orders</h3>
            <Link to="/admin/orders" className="text-xs font-bold text-cyan-700 hover:underline">
              View All Orders →
            </Link>
          </div>

          {stats.recent_orders.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center italic">No orders received yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-mono text-[11px] uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Order Number</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Payment</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.recent_orders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">{o.order_number}</td>
                      <td className="py-3 px-3">
                        <span className="font-semibold block text-slate-800">{o.guest_name || 'Customer'}</span>
                        <span className="text-slate-400 text-[11px] font-mono">{o.guest_phone}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                            o.payment_status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {o.payment_method} ({o.payment_status})
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[11px]">
                          {o.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        ₹{(o.total_paise / 100).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          to={`/admin/orders/${o.id}`}
                          className="text-cyan-700 hover:text-cyan-800 font-bold underline"
                        >
                          Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Best Sellers Leaderboard */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">
            Top Selling Products
          </h3>

          {stats.best_sellers.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center italic">
              Order metrics will aggregate here as sales occur.
            </p>
          ) : (
            <div className="space-y-3">
              {stats.best_sellers.map((item, idx) => (
                <div
                  key={item.sku || idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                >
                  <div className="max-w-[70%]">
                    <span className="font-bold text-slate-900 block truncate">{item.name}</span>
                    <span className="text-[11px] font-mono text-slate-400">SKU: {item.sku}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-cyan-700 font-mono block">
                      {item.total_quantity} sold
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      ₹{(item.total_revenue_paise / 100).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
