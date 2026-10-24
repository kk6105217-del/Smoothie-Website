import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Eye,
  AlertTriangle,
  Globe,
  EyeOff,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import { Product } from '../../types';
import { api } from '../../services/api';

export const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchProducts = async (searchTerm: string = '') => {
    setLoading(true);
    try {
      const res = await api.admin.listProducts({ search: searchTerm, page_size: 50 });
      setProducts(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to load products', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts(search.trim());
  };

  const handleTogglePublish = async (id: string, currentStatus: boolean, name: string) => {
    setTogglingId(id);
    try {
      const updated = await api.admin.publishProduct(id, !currentStatus);
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, is_published: updated.is_published } : p))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update publish status');
    } finally {
      setTogglingId(null);
    }
  };

  const handleArchive = async (id: string, name: string) => {
    if (
      !window.confirm(
        `Archive "${name}"? Archived items are preserved for past order invoices but hidden from storefront.`
      )
    ) {
      return;
    }
    try {
      await api.admin.archiveProduct(id);
      await fetchProducts(search.trim());
    } catch (err: any) {
      alert(err.message || 'Failed to archive product');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Product Catalog Management</h1>
            <span className="px-2 py-0.5 bg-slate-900 text-white rounded text-[10px] font-mono font-bold">
              VK Technology
            </span>
          </div>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            {total} total hardware components and project kits in database
          </p>
        </div>
        <Link
          to="/admin/products/new"
          className="px-4 py-2.5 bg-slate-900 hover:bg-cyan-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <Plus size={16} /> Add New Product
        </Link>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-md">
          <input
            type="text"
            placeholder="Search by SKU, product name, or brand..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-cyan-600 transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400 italic">No products found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-mono text-[11px] uppercase border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Component</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 font-mono">Price (₹)</th>
                  <th className="py-3 px-4 font-mono">Stock</th>
                  <th className="py-3 px-4">Status & Visibility</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => {
                  const img =
                    p.images && p.images.length > 0
                      ? p.images[0].image_url
                      : 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=200&q=80';
                  const isLow = p.stock_quantity <= p.low_stock_threshold && !p.is_archived;
                  const isToggling = togglingId === p.id;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={img}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover bg-slate-100 border border-slate-200 flex-shrink-0"
                          />
                          <div className="min-w-0 max-w-xs">
                            <span className="font-bold text-slate-900 block truncate">{p.name}</span>
                            <span className="font-mono text-[11px] text-slate-400">SKU: {p.sku}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {p.category?.name || 'Unassigned'}
                      </td>

                      <td className="py-3 px-4 font-mono">
                        <span className="font-bold text-slate-900">
                          ₹{(p.price / 100).toLocaleString('en-IN')}
                        </span>
                        {p.sale_price && (
                          <span className="text-[11px] text-emerald-600 block">
                            Sale: ₹{(p.sale_price / 100).toLocaleString('en-IN')}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono">
                        <span
                          className={`font-bold ${
                            p.stock_quantity <= 0
                              ? 'text-rose-600'
                              : isLow
                              ? 'text-amber-600'
                              : 'text-slate-900'
                          }`}
                        >
                          {p.stock_quantity}
                        </span>
                        {isLow && (
                          <span className="text-[10px] text-amber-600 block flex items-center gap-0.5">
                            <AlertTriangle size={10} /> Low Stock
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {p.is_archived ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                            ARCHIVED
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleTogglePublish(p.id, p.is_published, p.name)}
                              disabled={isToggling}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 transition-all ${
                                p.is_published
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                  : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                              } disabled:opacity-50`}
                              title={p.is_published ? 'Click to unpublish (switch to draft)' : 'Click to publish (make visible)'}
                            >
                              {p.is_published ? (
                                <>
                                  <Globe size={11} className="text-emerald-700" /> PUBLISHED
                                </>
                              ) : (
                                <>
                                  <EyeOff size={11} className="text-amber-700" /> DRAFT
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                        {/* Preview Product in Storefront */}
                        {!p.is_archived && (
                          <a
                            href={`/products/${p.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-500 hover:text-cyan-700 hover:bg-cyan-50 rounded-lg inline-block transition-colors"
                            title="Preview in Storefront"
                          >
                            <ExternalLink size={15} />
                          </a>
                        )}

                        {/* Edit Product */}
                        <Link
                          to={`/admin/products/${p.id}/edit`}
                          className="p-1.5 text-slate-600 hover:text-cyan-700 hover:bg-cyan-50 rounded-lg inline-block transition-colors"
                          title="Edit Product"
                        >
                          <Edit3 size={15} />
                        </Link>

                        {/* Archive / Delete Product */}
                        {!p.is_archived && (
                          <button
                            onClick={() => handleArchive(p.id, p.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg inline-block transition-colors"
                            title="Archive Product"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
