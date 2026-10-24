import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Filter, SlidersHorizontal, Search, RefreshCw, X, Star, CheckSquare, Square } from 'lucide-react';
import { Product, Category, ProductListResponse } from '../types';
import { api } from '../services/api';
import { ProductCard } from '../components/common/ProductCard';

export const Shop: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters from URL params
  const searchQuery = searchParams.get('search') || '';
  const selectedCategory = searchParams.get('category') || '';
  const selectedSort = searchParams.get('sort') || 'newest';
  const inStockOnly = searchParams.get('in_stock') === 'true';
  const saleOnly = searchParams.get('sale') === 'true';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  const [searchInput, setSearchInput] = useState(searchQuery);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const cats = await api.listCategories();
        setCategories(cats);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    }
    fetchCategories();
  }, []);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const res: ProductListResponse = await api.listProducts({
          search: searchQuery,
          category: selectedCategory,
          sort: selectedSort,
          in_stock: inStockOnly,
          page: currentPage,
          page_size: 16,
        });

        let items = res.items;
        if (saleOnly) {
          items = items.filter((p) => p.sale_price && p.sale_price < p.price);
        }

        setProducts(items);
        setTotal(res.total);
        setTotalPages(res.total_pages);
      } catch (err) {
        console.error('Failed to load products', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [searchQuery, selectedCategory, selectedSort, inStockOnly, saleOnly, currentPage]);

  const updateParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (value === null || value === '' || value === 'false') {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    if (key !== 'page') {
      next.delete('page');
    }
    setSearchParams(next);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam('search', searchInput.trim() || null);
  };

  const clearAllFilters = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams());
  };

  const hasActiveFilters = !!(searchQuery || selectedCategory || inStockOnly || saleOnly);

  return (
    <div className="bg-[#f7f8f8] min-h-screen font-sans pb-16">
      {/* Top Results Bar */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-2.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <p className="text-slate-600">
            {loading ? (
              'Searching components...'
            ) : (
              <span>
                1-{products.length} of <span className="font-bold text-slate-900">{total} results</span>
                {searchQuery && (
                  <span> for <span className="text-[#c45500] font-bold">"{searchQuery}"</span></span>
                )}
                {selectedCategory && (
                  <span> in <span className="font-semibold text-slate-900">{categories.find((c) => c.slug === selectedCategory)?.name || selectedCategory}</span></span>
                )}
              </span>
            )}
          </p>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <label className="text-slate-600 font-medium">Sort by:</label>
            <select
              value={selectedSort}
              onChange={(e) => updateParam('sort', e.target.value)}
              className="border border-slate-300 rounded px-2.5 py-1 text-xs bg-slate-50 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="newest">Featured & Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="popularity">Avg. Customer Review</option>
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Amazon-Style Filter Sidebar (3 Cols) */}
          <aside className="lg:col-span-3 bg-white p-4 rounded-lg border border-slate-200/90 shadow-xs space-y-6 text-xs">
            {/* Header / Clear Filters */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Filter size={16} className="text-slate-700" /> Filter Results
              </span>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="text-cyan-700 hover:underline font-semibold"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Department Categories Filter */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 uppercase text-[11px] font-mono tracking-wider">
                Department
              </h4>
              <div className="space-y-1">
                <button
                  onClick={() => updateParam('category', null)}
                  className={`block text-left w-full py-1 px-1.5 rounded transition-colors ${
                    !selectedCategory ? 'font-bold text-slate-900 bg-slate-100' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Departments
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => updateParam('category', c.slug)}
                    className={`block text-left w-full py-1 px-1.5 rounded transition-colors truncate ${
                      selectedCategory === c.slug
                        ? 'font-bold text-[#c45500] bg-amber-50/80'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Availability Filter */}
            <div className="space-y-2 pt-3 border-t border-slate-200">
              <h4 className="font-bold text-slate-900 uppercase text-[11px] font-mono tracking-wider">
                Availability
              </h4>
              <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => updateParam('in_stock', e.target.checked ? 'true' : null)}
                  className="rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                />
                <span>Include Out of Stock</span>
              </label>
            </div>

            {/* Deals & Discounts Filter */}
            <div className="space-y-2 pt-3 border-t border-slate-200">
              <h4 className="font-bold text-slate-900 uppercase text-[11px] font-mono tracking-wider">
                Deals & Discounts
              </h4>
              <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                <input
                  type="checkbox"
                  checked={saleOnly}
                  onChange={(e) => updateParam('sale', e.target.checked ? 'true' : null)}
                  className="rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                />
                <span className="font-semibold text-[#cc0c39]">Today's Deals Only</span>
              </label>
            </div>

            {/* Customer Review Filter */}
            <div className="space-y-2 pt-3 border-t border-slate-200">
              <h4 className="font-bold text-slate-900 uppercase text-[11px] font-mono tracking-wider">
                Avg. Customer Review
              </h4>
              <div className="space-y-1">
                {[4, 3, 2].map((minRating) => (
                  <div key={minRating} className="flex items-center gap-1.5 text-amber-500 cursor-pointer hover:text-amber-600 py-0.5">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={13}
                          className={i < minRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
                        />
                      ))}
                    </div>
                    <span className="text-slate-700 text-[11px]">& Up</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pay on Delivery & Fast Shipping Promise */}
            <div className="space-y-1.5 pt-3 border-t border-slate-200 text-slate-600 text-[11px]">
              <p className="font-bold text-slate-900">Delivery Day</p>
              <p className="text-cyan-800 font-semibold">✓ Get It in 2-4 Days</p>
              <p className="font-bold text-slate-900 pt-2">Payment</p>
              <p className="text-slate-700">✓ Cash on Delivery Eligible</p>
            </div>
          </aside>

          {/* Right Product Grid (9 Cols) */}
          <main className="lg:col-span-9 space-y-6">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, n) => (
                  <div key={n} className="h-72 bg-white rounded-lg border border-slate-200 animate-pulse" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-lg p-12 text-center space-y-4">
                <h3 className="text-base font-bold text-slate-900">No matching components found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try checking your spelling or use more general terms like "Arduino", "ESP32", or "Sensor".
                </p>
                <button
                  onClick={clearAllFilters}
                  className="px-5 py-2 bg-[#ffd814] hover:bg-[#f7ca00] text-slate-900 font-bold rounded-full text-xs shadow-xs border border-[#fcd200]"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((p, idx) => (
                  <ProductCard key={p.id} product={p} isBestSeller={idx === 0} />
                ))}
              </div>
            )}

            {/* Amazon-Style Pagination Controls */}
            {totalPages > 1 && (
              <div className="pt-6 border-t border-slate-200 flex items-center justify-center gap-2 text-xs">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => updateParam('page', (currentPage - 1).toString())}
                  className="px-3.5 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 font-medium"
                >
                  ← Previous
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => updateParam('page', (i + 1).toString())}
                    className={`w-8 h-8 rounded text-xs font-bold transition-colors ${
                      currentPage === i + 1
                        ? 'bg-slate-900 text-white'
                        : 'border border-slate-300 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => updateParam('page', (currentPage + 1).toString())}
                  className="px-3.5 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 font-medium"
                >
                  Next →
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
