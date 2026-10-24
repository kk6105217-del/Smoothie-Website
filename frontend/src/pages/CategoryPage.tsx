import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, Layers, ArrowLeft, SlidersHorizontal } from 'lucide-react';
import { Product, Category } from '../types';
import { api } from '../services/api';
import { ProductCard } from '../components/common/ProductCard';

export const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState('newest');

  useEffect(() => {
    async function loadCategoryData() {
      if (!slug) return;
      setLoading(true);
      try {
        const [cats, prodRes] = await Promise.all([
          api.listCategories(),
          api.listProducts({ category: slug, sort: sortOrder, page_size: 24 }),
        ]);
        const currentCat = cats.find((c) => c.slug === slug);
        setCategory(currentCat || null);
        setProducts(prodRes.items);
        setTotal(prodRes.total);
      } catch (err) {
        console.error('Failed to load category products', err);
      } finally {
        setLoading(false);
      }
    }
    loadCategoryData();
  }, [slug, sortOrder]);

  return (
    <div className="bg-[#f7f8f8] min-h-screen py-6 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Amazon-Style Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-500">
          <Link to="/" className="hover:text-cyan-700">Home</Link>
          <ChevronRight size={13} className="text-slate-400" />
          <Link to="/shop" className="hover:text-cyan-700">Departments</Link>
          <ChevronRight size={13} className="text-slate-400" />
          <span className="text-slate-900 font-semibold">{category?.name || slug}</span>
        </nav>

        {/* Amazon Category Top Banner */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {category?.name || 'Hardware Category'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              {category?.description || 'Authentic components, breakout boards, and DIY kits ready for fast dispatch across India.'}
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500 bg-slate-100 px-3 py-1.5 rounded-md self-start md:self-auto font-medium">
            {total} results found
          </span>
        </div>

        {/* Sorting Toolbar */}
        <div className="bg-white border border-slate-200/90 rounded-lg px-4 py-2.5 flex items-center justify-between text-xs shadow-xs">
          <span className="text-slate-600">
            Showing <span className="font-bold text-slate-900">1-{products.length}</span> of <span className="font-bold text-slate-900">{total}</span> items
          </span>

          <div className="flex items-center gap-2">
            <label className="text-slate-600 font-medium">Sort by:</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="border border-slate-300 rounded px-2.5 py-1 text-xs bg-slate-50 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="newest">Featured & Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="popularity">Avg. Customer Review</option>
            </select>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="h-72 bg-white rounded-lg border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-lg p-12 text-center space-y-4">
            <h3 className="text-base font-bold text-slate-900">No components currently listed in this department</h3>
            <p className="text-xs text-slate-500">
              New stock is added weekly. Explore our other hardware sections in the meantime.
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#ffd814] hover:bg-[#f7ca00] text-slate-900 text-xs font-bold rounded-full transition-colors border border-[#fcd200]"
            >
              <ArrowLeft size={14} />
              Browse Other Departments
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p, idx) => (
              <ProductCard key={p.id} product={p} isBestSeller={idx === 0} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
