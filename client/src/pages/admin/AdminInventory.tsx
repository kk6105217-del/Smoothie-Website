import React, { useState, useEffect } from 'react';
import { Boxes, AlertTriangle, CheckCircle2, Search, Save, Package } from 'lucide-react';
import { api } from '../../services/api';
import { Product } from '../../types';

export const AdminInventory: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [stockInputs, setStockInputs] = useState<Record<number, number>>({});
  const [savedSuccessId, setSavedSuccessId] = useState<number | null>(null);
  const [filterStock, setFilterStock] = useState<'all' | 'low' | 'out'>('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const res = await api.products.getAdminAll();
      const list = res.products || [];
      setProducts(list);

      const map: Record<number, number> = {};
      list.forEach(p => { map[p.id] = p.stock_quantity; });
      setStockInputs(map);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveStock = async (id: number) => {
    const val = stockInputs[id];
    if (val === undefined || isNaN(val) || val < 0) return;

    try {
      await api.products.updateStock(id, Number(val));
      setSavedSuccessId(id);
      setTimeout(() => setSavedSuccessId(null), 2000);
      loadProducts();
    } catch (e: any) {
      alert(e.message || 'Stock save failed');
    }
  };

  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (filterStock === 'low') return p.stock_quantity > 0 && p.stock_quantity <= 5;
    if (filterStock === 'out') return p.stock_quantity === 0;
    return true;
  });

  const lowStockCount = products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= 5).length;
  const outOfStockCount = products.filter(p => p.stock_quantity === 0).length;

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-200 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory & Stock Controls</h1>
          <p className="text-xs text-gray-500">
            Monitor real-time component stock levels, prevent inventory stockouts, and batch update quantities.
          </p>
        </div>
      </div>

      {/* Metric pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => setFilterStock('all')}
          className={`p-4 rounded-xl border text-left transition ${
            filterStock === 'all' ? 'bg-amber-50 border-amber-400 ring-1 ring-amber-400' : 'bg-white border-gray-200 hover:bg-gray-50'
          }`}
        >
          <span className="text-xs font-semibold text-gray-500 uppercase">Total Tracked SKUs</span>
          <div className="text-2xl font-bold text-gray-900 mt-1">{products.length}</div>
        </button>

        <button
          onClick={() => setFilterStock('low')}
          className={`p-4 rounded-xl border text-left transition ${
            filterStock === 'low' ? 'bg-orange-50 border-orange-400 ring-1 ring-orange-400' : 'bg-white border-gray-200 hover:bg-gray-50'
          }`}
        >
          <span className="text-xs font-semibold text-orange-700 uppercase">Low Stock Alert (≤ 5)</span>
          <div className="text-2xl font-bold text-orange-600 mt-1">{lowStockCount}</div>
        </button>

        <button
          onClick={() => setFilterStock('out')}
          className={`p-4 rounded-xl border text-left transition ${
            filterStock === 'out' ? 'bg-red-50 border-red-400 ring-1 ring-red-400' : 'bg-white border-gray-200 hover:bg-gray-50'
          }`}
        >
          <span className="text-xs font-semibold text-red-700 uppercase">Out of Stock (0 Units)</span>
          <div className="text-2xl font-bold text-red-600 mt-1">{outOfStockCount}</div>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
        <div className="relative w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by SKU or component name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded text-xs focus:outline-none"
          />
        </div>
        <span className="text-xs text-gray-500">
          Showing <strong>{filtered.length}</strong> components
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Component / Board</th>
                <th className="py-3 px-3">SKU</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Current Stock</th>
                <th className="py-3 px-3">Adjust / Restock</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((p) => {
                const isOutOfStock = p.stock_quantity === 0;
                const isLow = p.stock_quantity > 0 && p.stock_quantity <= 5;

                return (
                  <tr key={p.id} className="hover:bg-gray-50 transition">
                    <td className="py-3 px-4 flex items-center space-x-3">
                      <img
                        src={p.primary_image || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=100&q=80'}
                        alt={p.name}
                        className="w-9 h-9 object-contain rounded border bg-gray-50 p-1 shrink-0"
                      />
                      <span className="font-semibold text-gray-900 line-clamp-1">{p.name}</span>
                    </td>

                    <td className="py-3 px-3 font-mono font-bold text-gray-600">
                      {p.sku}
                    </td>

                    <td className="py-3 px-3">
                      {isOutOfStock ? (
                        <span className="bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded text-[10px]">
                          Out of Stock
                        </span>
                      ) : isLow ? (
                        <span className="bg-orange-100 text-orange-800 font-bold px-2 py-0.5 rounded text-[10px]">
                          Low Stock
                        </span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">
                          Available
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 font-bold font-mono text-gray-800">
                      {p.stock_quantity}
                    </td>

                    <td className="py-3 px-3">
                      <input
                        type="number"
                        min="0"
                        value={stockInputs[p.id] ?? p.stock_quantity}
                        onChange={(e) => setStockInputs({ ...stockInputs, [p.id]: parseInt(e.target.value) || 0 })}
                        className="w-24 px-2 py-1 border border-gray-300 rounded font-mono font-bold text-xs"
                      />
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleSaveStock(p.id)}
                        className={`font-bold px-3 py-1 rounded text-xs transition shadow-sm ${
                          savedSuccessId === p.id
                            ? 'bg-emerald-600 text-white'
                            : 'bg-amber-400 hover:bg-amber-500 text-gray-950'
                        }`}
                      >
                        {savedSuccessId === p.id ? 'Saved!' : 'Update'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
