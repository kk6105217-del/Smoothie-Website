import React, { useEffect, useState } from 'react';
import { Product } from '../../types';
import { api } from '../../services/api';
import { FiAlertTriangle, FiCheckCircle, FiSearch, FiRefreshCw, FiSave, FiXCircle, FiPackage } from 'react-icons/fi';

export const AdminInventory: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'LOW' | 'OUT'>('ALL');

  // Stock edit tracking { [productId]: newStockQuantity }
  const [stockDrafts, setStockDrafts] = useState<Record<string, number>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch all products with large page size
      const res = await api.admin.listProducts({ page_size: 100 });
      setProducts(res.items);
      const drafts: Record<string, number> = {};
      res.items.forEach((p) => {
        drafts[p.id] = p.stock_quantity;
      });
      setStockDrafts(drafts);
    } catch (err: any) {
      setError(err.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleStockChange = (productId: string, val: number) => {
    setStockDrafts((prev) => ({
      ...prev,
      [productId]: Math.max(0, val),
    }));
  };

  const saveStock = async (product: Product) => {
    const newQty = stockDrafts[product.id];
    if (newQty === undefined || newQty === product.stock_quantity) return;

    try {
      setSavingId(product.id);
      setError(null);
      await api.admin.updateProduct(product.id, {
        stock_quantity: newQty,
      });
      setSuccess(`Updated stock for ${product.name} to ${newQty} units.`);
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, stock_quantity: newQty } : p))
      );
    } catch (err: any) {
      setError(err.message || 'Failed to save stock update');
    } finally {
      setSavingId(null);
    }
  };

  // Counters
  const totalCount = products.length;
  const outOfStockCount = products.filter((p) => p.stock_quantity <= 0).length;
  const lowStockCount = products.filter(
    (p) => p.stock_quantity > 0 && p.stock_quantity <= p.low_stock_threshold
  ).length;
  const inStockCount = products.filter((p) => p.stock_quantity > p.low_stock_threshold).length;

  const filtered = products.filter((p) => {
    // Search
    if (search.trim()) {
      const term = search.toLowerCase();
      const matchName = p.name.toLowerCase().includes(term);
      const matchSku = p.sku.toLowerCase().includes(term);
      if (!matchName && !matchSku) return false;
    }
    // Filter mode
    if (filterMode === 'OUT') return p.stock_quantity <= 0;
    if (filterMode === 'LOW') return p.stock_quantity > 0 && p.stock_quantity <= p.low_stock_threshold;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track available electronics stock, adjust inventory in real time, and resolve low-stock warnings.
          </p>
        </div>
        <button
          onClick={fetchProducts}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
          title="Refresh"
        >
          <FiRefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)}>✕</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          onClick={() => setFilterMode('ALL')}
          className={`p-4 rounded-xl border cursor-pointer transition ${
            filterMode === 'ALL' ? 'bg-primary-50 border-primary-300' : 'bg-white border-gray-200 hover:bg-gray-50'
          }`}
        >
          <div className="text-xs font-semibold text-gray-500 uppercase">Total SKUs</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{totalCount}</div>
        </div>

        <div
          onClick={() => setFilterMode('ALL')}
          className="p-4 rounded-xl border bg-white border-gray-200 cursor-pointer hover:bg-gray-50 transition"
        >
          <div className="text-xs font-semibold text-emerald-600 uppercase flex items-center gap-1">
            <FiCheckCircle /> Healthy Stock
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{inStockCount}</div>
        </div>

        <div
          onClick={() => setFilterMode('LOW')}
          className={`p-4 rounded-xl border cursor-pointer transition ${
            filterMode === 'LOW' ? 'bg-amber-50 border-amber-300' : 'bg-white border-gray-200 hover:bg-gray-50'
          }`}
        >
          <div className="text-xs font-semibold text-amber-600 uppercase flex items-center gap-1">
            <FiAlertTriangle /> Low Stock
          </div>
          <div className="text-2xl font-bold text-amber-900 mt-1">{lowStockCount}</div>
        </div>

        <div
          onClick={() => setFilterMode('OUT')}
          className={`p-4 rounded-xl border cursor-pointer transition ${
            filterMode === 'OUT' ? 'bg-red-50 border-red-300' : 'bg-white border-gray-200 hover:bg-gray-50'
          }`}
        >
          <div className="text-xs font-semibold text-red-600 uppercase flex items-center gap-1">
            <FiXCircle /> Out of Stock
          </div>
          <div className="text-2xl font-bold text-red-900 mt-1">{outOfStockCount}</div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <FiSearch className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by SKU or product name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setFilterMode('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              filterMode === 'ALL' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Items
          </button>
          <button
            onClick={() => setFilterMode('LOW')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              filterMode === 'LOW' ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Low Stock Only ({lowStockCount})
          </button>
          <button
            onClick={() => setFilterMode('OUT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              filterMode === 'OUT' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Out of Stock ({outOfStockCount})
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Item</th>
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">Unit Price</th>
                <th className="py-3 px-4 text-center">Threshold</th>
                <th className="py-3 px-4 text-center">Stock Status</th>
                <th className="py-3 px-4 text-center">Available Stock</th>
                <th className="py-3 px-4 text-right">Quick Save</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    <FiRefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary-600" />
                    Loading inventory...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    <FiPackage className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                    No products match the selected criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((product) => {
                  const currentDraft = stockDrafts[product.id] ?? product.stock_quantity;
                  const isDirty = currentDraft !== product.stock_quantity;
                  const isLow = product.stock_quantity > 0 && product.stock_quantity <= product.low_stock_threshold;
                  const isOut = product.stock_quantity <= 0;

                  return (
                    <tr key={product.id} className="hover:bg-gray-50 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {product.images && product.images[0] ? (
                            <img
                              src={product.images[0].image_url}
                              alt={product.name}
                              className="w-10 h-10 object-cover rounded border border-gray-200"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                              <FiPackage />
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-gray-900 truncate max-w-xs">{product.name}</div>
                            <div className="text-xs text-gray-500">{product.category?.name || 'Components'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs font-semibold text-gray-600">{product.sku}</td>
                      <td className="py-3 px-4 font-medium text-gray-900">
                        ₹{(product.price / 100).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-xs text-gray-500">
                        {product.low_stock_threshold}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isOut ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            Healthy
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleStockChange(product.id, currentDraft - 1)}
                            className="w-7 h-7 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 font-bold transition"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={currentDraft}
                            onChange={(e) => handleStockChange(product.id, parseInt(e.target.value) || 0)}
                            className="w-20 px-2 py-1 text-center font-bold text-gray-900 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleStockChange(product.id, currentDraft + 1)}
                            className="w-7 h-7 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 font-bold transition"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          disabled={!isDirty || savingId === product.id}
                          onClick={() => saveStock(product)}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                            isDirty
                              ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-sm'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          <FiSave />
                          {savingId === product.id ? 'Saving...' : 'Save'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
