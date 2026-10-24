import React, { useState, useEffect } from 'react';
import { api, getAuthToken } from '../../services/api';
import {
  BarChart3,
  Download,
  Calendar,
  TrendingUp,
  ShoppingBag,
  CreditCard,
  Package,
  Layers,
  ArrowUpRight,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';

export const AdminReports: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [dailySales, setDailySales] = useState<any[]>([]);
  const [bestSellers, setBestSellers] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const data = await api.settings.getAdminStats();
        setStats(data.stats);
        setDailySales(data.dailySales || []);
        setBestSellers(data.bestSellers || []);
        setRecentOrders(data.recentOrders || []);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to generate sales report.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const downloadOrdersCsv = () => {
    const token = getAuthToken();
    const url = `/api/orders/admin/export/csv`;
    fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to download orders CSV');
        return res.blob();
      })
      .then((blob) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `vk_technology_orders_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      })
      .catch((err) => {
        alert(err.message || 'Download failed');
      });
  };

  const downloadSalesCsv = () => {
    const token = getAuthToken();
    const url = `/api/settings/admin/sales-report-csv`;
    fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to download daily sales CSV');
        return res.blob();
      })
      .then((blob) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `vk_technology_daily_sales_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      })
      .catch((err) => {
        alert(err.message || 'Download failed');
      });
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="text-amber-500" size={24} />
            Sales Reports & Analytics
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Store performance metrics, revenue logs, best-selling inventory, and instant accounting CSV exports.
          </p>
        </div>

        {/* CSV Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={downloadSalesCsv}
            className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 font-semibold px-3.5 py-2 rounded text-xs flex items-center gap-1.5 shadow-sm transition"
          >
            <FileSpreadsheet size={15} className="text-green-600" />
            Daily Revenue CSV
          </button>
          <button
            onClick={downloadOrdersCsv}
            className="bg-amber-400 hover:bg-amber-500 text-gray-950 font-bold px-4 py-2 rounded text-xs flex items-center gap-1.5 shadow-sm transition"
          >
            <Download size={15} />
            Export All Orders CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-white p-12 text-center rounded-lg border border-gray-200">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto" />
          <p className="text-xs text-gray-500 mt-2">Compiling store reports...</p>
        </div>
      ) : (
        <>
          {/* Key Metrics Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                  Net Store Revenue
                </span>
                <span className="text-2xl font-black text-gray-900 mt-1 block">
                  {formatPrice(stats?.total_sales || 0)}
                </span>
                <span className="text-[11px] text-green-700 font-medium flex items-center gap-0.5 mt-0.5">
                  <TrendingUp size={12} /> Confirmed & Paid
                </span>
              </div>
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center">
                <CreditCard size={22} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                  Total Orders
                </span>
                <span className="text-2xl font-black text-gray-900 mt-1 block">
                  {stats?.total_orders || 0}
                </span>
                <span className="text-[11px] text-blue-600 font-medium mt-0.5 block">
                  {stats?.completed_orders || 0} Delivered
                </span>
              </div>
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                <ShoppingBag size={22} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                  Active Catalog
                </span>
                <span className="text-2xl font-black text-gray-900 mt-1 block">
                  {stats?.total_products || 0}
                </span>
                <span className="text-[11px] text-gray-500 mt-0.5 block">
                  Across 15 Tech Categories
                </span>
              </div>
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center">
                <Layers size={22} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                  Pending Orders
                </span>
                <span className="text-2xl font-black text-amber-600 mt-1 block">
                  {stats?.pending_orders || 0}
                </span>
                <span className="text-[11px] text-amber-700 font-medium mt-0.5 block">
                  Requires Packing / Dispatch
                </span>
              </div>
              <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center">
                <Package size={22} />
              </div>
            </div>
          </div>

          {/* Daily Sales Log Table */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                <Calendar size={15} className="text-gray-500" />
                Recent Daily Sales Activity (Past 14 Days)
              </h2>
              <span className="text-[11px] text-gray-500">
                {dailySales.length} active sales days recorded
              </span>
            </div>

            {dailySales.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-500">
                No orders have been recorded in the past 14 days.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-600 font-semibold uppercase tracking-wider text-[10px] border-b">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Orders Placed</th>
                      <th className="px-4 py-3 text-right">Daily Revenue</th>
                      <th className="px-4 py-3 text-right">Avg. Order Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {dailySales.map((ds, idx) => {
                      const avg = ds.orders_count > 0 ? ds.total_revenue / ds.orders_count : 0;
                      return (
                        <tr key={idx} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-3 font-semibold text-gray-800">
                            {new Date(ds.sale_date).toLocaleDateString('en-IN', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="px-4 py-3">
                            <span className="bg-blue-50 text-blue-800 px-2.5 py-0.5 rounded font-bold">
                              {ds.orders_count} orders
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-gray-900">
                            {formatPrice(ds.total_revenue)}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-600">
                            {formatPrice(avg)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Top Selling Products */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                <TrendingUp size={15} className="text-amber-500" />
                Best-Selling Products & Popular Kits
              </h2>
            </div>
            {bestSellers.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-500">
                No product sales logged yet.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {bestSellers.map((prod) => (
                  <div key={prod.id} className="p-4 flex items-center justify-between text-xs hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <img
                        src={prod.image_url || 'https://via.placeholder.com/60'}
                        alt={prod.name}
                        className="w-12 h-12 object-contain rounded border border-gray-200 p-1 bg-white"
                      />
                      <div>
                        <h3 className="font-bold text-gray-900 text-xs">{prod.name}</h3>
                        <p className="text-[11px] text-gray-500">
                          Price: {formatPrice(prod.discounted_price || prod.regular_price)} • Stock: {prod.stock_quantity} left
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-amber-600 text-sm block">
                        {prod.units_sold || 0} units
                      </span>
                      <span className="text-[10px] text-gray-400">Total Sold</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
