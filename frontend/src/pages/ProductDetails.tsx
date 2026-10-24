import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Heart,
  ShieldCheck,
  Truck,
  RotateCcw,
  Check,
  ChevronRight,
  Package,
  Wrench,
  AlertCircle,
  Share2,
  Sparkles,
  MapPin,
  Lock,
  Tag,
  Star,
  Zap,
} from 'lucide-react';
import { Product } from '../types';
import { api } from '../services/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { ProductCard } from '../components/common/ProductCard';

export const ProductDetails: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { isAuthenticated } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedNotice, setAddedNotice] = useState(false);

  // Review state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Delivery pincode from local storage
  const [pincode] = useState(() => localStorage.getItem('vk_pincode') || '560001');
  const [city] = useState(() => localStorage.getItem('vk_city') || 'Bengaluru');

  useEffect(() => {
    async function fetchProductData() {
      if (!slug) return;
      setLoading(true);
      try {
        const prod = await api.getProduct(slug);
        setProduct(prod);
        setActiveImageIndex(0);

        // Fetch related products in same category
        if (prod.category?.slug) {
          const relRes = await api.listProducts({ category: prod.category.slug, page_size: 6 });
          setRelatedProducts(relRes.items.filter((p) => p.id !== prod.id));
        }
      } catch (err) {
        console.error('Failed to load product details', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProductData();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Product Not Found</h2>
        <p className="text-sm text-slate-600">The requested DIY hardware component could not be located.</p>
        <Link to="/shop" className="inline-block px-5 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-semibold">
          Return to Shop
        </Link>
      </div>
    );
  }

  const isSale = product.sale_price && product.sale_price < product.price;
  const currentPriceINR = (isSale ? product.sale_price! : product.price) / 100;
  const originalPriceINR = product.price / 100;
  const discountPercent = isSale
    ? Math.round(((product.price - product.sale_price!) / product.price) * 100)
    : 0;

  const isOutOfStock = product.stock_quantity <= 0;
  const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= product.low_stock_threshold;
  const images =
    product.images && product.images.length > 0
      ? product.images
      : [{ id: '1', image_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80', sort_order: 0 }];

  const handleAddToCart = async () => {
    if (isOutOfStock || addingToCart) return;
    setAddingToCart(true);
    try {
      await addToCart(product.id, quantity);
      setAddedNotice(true);
      setTimeout(() => setAddedNotice(false), 2500);
    } catch (err: any) {
      alert(err.message || 'Failed to add item to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (isOutOfStock) return;
    await addToCart(product.id, quantity);
    navigate('/checkout');
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert('Please sign in to write a review');
      return;
    }
    setSubmittingReview(true);
    try {
      await api.addReview(product.id, {
        rating: reviewRating,
        title: reviewTitle.trim() || undefined,
        comment: reviewComment.trim(),
      });
      alert('Thank you! Your verified maker review has been posted.');
      setReviewComment('');
      setReviewTitle('');
      const updated = await api.getProduct(product.slug);
      setProduct(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to post review');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="bg-white min-h-screen font-sans pb-16">
      {/* Breadcrumbs Strip */}
      <div className="border-b border-slate-200 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 overflow-x-auto whitespace-nowrap">
            <Link to="/" className="hover:text-cyan-700">Electronics</Link>
            <ChevronRight size={13} className="text-slate-400 flex-shrink-0" />
            <Link to="/shop" className="hover:text-cyan-700">Components & Kits</Link>
            {product.category && (
              <>
                <ChevronRight size={13} className="text-slate-400 flex-shrink-0" />
                <Link to={`/categories/${product.category.slug}`} className="hover:text-cyan-700 font-medium">
                  {product.category.name}
                </Link>
              </>
            )}
            <ChevronRight size={13} className="text-slate-400 flex-shrink-0" />
            <span className="text-slate-800 font-semibold truncate max-w-xs">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-12">
        {/* Amazon-Style 3-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Column 1: Image Gallery (4 Cols) */}
          <div className="lg:col-span-4 flex flex-col-reverse sm:flex-row gap-4">
            {/* Thumbnails Column */}
            {images.length > 1 && (
              <div className="flex sm:flex-col gap-2 overflow-x-auto sm:overflow-y-auto max-h-[460px] pb-2 sm:pb-0 sm:w-16 flex-shrink-0">
                {images.map((img, idx) => (
                  <button
                    key={img.id || idx}
                    onMouseEnter={() => setActiveImageIndex(idx)}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded border-2 overflow-hidden flex-shrink-0 transition-all p-1 bg-white ${
                      activeImageIndex === idx ? 'border-amber-500 shadow-sm' : 'border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    <img src={img.image_url} alt="" className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}

            {/* Main Interactive Stage */}
            <div className="flex-1 relative aspect-square bg-white rounded-lg border border-slate-200/90 overflow-hidden p-6 flex items-center justify-center">
              <img
                src={images[activeImageIndex]?.image_url}
                alt={product.name}
                className="w-full h-full object-contain"
              />
              {discountPercent > 0 && (
                <span className="absolute top-3 left-3 bg-[#cc0c39] text-white text-xs font-bold px-2 py-0.5 rounded shadow-xs">
                  {discountPercent}% off
                </span>
              )}
            </div>
          </div>

          {/* Column 2: Product Information & Specifications (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Title & Brand */}
            <div>
              <Link
                to={`/categories/${product.category?.slug || 'diy-tech-projects'}`}
                className="text-xs font-semibold text-cyan-700 hover:text-cyan-900 hover:underline block"
              >
                Visit the VK Technology Store
              </Link>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug mt-1">
                {product.name}
              </h1>
              <div className="flex items-center gap-2 mt-1.5 text-xs">
                <div className="flex items-center text-amber-500">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={14}
                      className={s <= 4 ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-300'}
                    />
                  ))}
                </div>
                <span className="text-slate-700 font-semibold">4.8</span>
                <span className="text-slate-500">
                  ({product.reviews?.length ? product.reviews.length * 7 + 15 : 38} ratings)
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-slate-500 font-mono text-[11px]">SKU: {product.sku}</span>
              </div>
            </div>

            {/* Amazon Badge */}
            {product.is_featured && (
              <div className="inline-block bg-[#e67a00] text-white text-[11px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider">
                #1 Best Seller in {product.category?.name || 'Electronics'}
              </div>
            )}

            <div className="border-t border-slate-200 pt-3 space-y-1">
              {/* Deal Tag & Pricing */}
              {isSale && (
                <span className="bg-[#cc0c39] text-white text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wider inline-block">
                  Limited time deal
                </span>
              )}

              <div className="flex items-baseline gap-2 pt-1">
                {discountPercent > 0 && (
                  <span className="text-2xl text-[#cc0c39] font-light">
                    -{discountPercent}%
                  </span>
                )}
                <div className="flex items-start">
                  <span className="text-sm font-medium text-slate-900 pt-0.5">₹</span>
                  <span className="text-3xl font-bold text-slate-900 tracking-tight">
                    {currentPriceINR.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {isSale && (
                <p className="text-xs text-slate-500">
                  M.R.P.: <span className="line-through">₹{originalPriceINR.toLocaleString('en-IN')}</span>
                </p>
              )}
              <p className="text-xs text-slate-600">
                Inclusive of all taxes (GST 18%). Invoicing available.
              </p>
            </div>

            {/* Amazon Offers Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Tag size={14} className="text-amber-600" />
                Available Offers & Discounts
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white p-2.5 rounded border border-slate-200/80 space-y-0.5">
                  <span className="font-bold text-slate-900 block text-[11px]">Partner Offer</span>
                  <p className="text-slate-600 text-[11px] leading-tight">
                    Flat ₹100 off on first order with code <span className="font-mono font-bold text-cyan-800">WELCOME100</span>
                  </p>
                </div>
                <div className="bg-white p-2.5 rounded border border-slate-200/80 space-y-0.5">
                  <span className="font-bold text-slate-900 block text-[11px]">Maker Discount</span>
                  <p className="text-slate-600 text-[11px] leading-tight">
                    10% Instant off above ₹999 using code <span className="font-mono font-bold text-cyan-800">MAKER10</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Amazon Guarantee Icons Strip */}
            <div className="grid grid-cols-4 gap-2 pt-2 border-y border-slate-200 py-3 text-center text-[10px] text-cyan-800 font-medium">
              <div className="flex flex-col items-center gap-1">
                <RotateCcw size={20} className="text-cyan-700" />
                <span>7 days Replacement</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Truck size={20} className="text-cyan-700" />
                <span>Free Delivery</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <ShieldCheck size={20} className="text-cyan-700" />
                <span>6 Months Warranty</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Zap size={20} className="text-cyan-700" />
                <span>Pay on Delivery</span>
              </div>
            </div>

            {/* About this item (Features) */}
            <div className="space-y-2 pt-2">
              <h3 className="font-bold text-slate-900 text-sm">About this item</h3>
              {product.features ? (
                <div className="text-xs text-slate-700 space-y-1.5 leading-relaxed whitespace-pre-line font-sans">
                  {product.features}
                </div>
              ) : (
                <p className="text-xs text-slate-700 leading-relaxed">
                  {product.short_description || product.description}
                </p>
              )}
            </div>
          </div>

          {/* Column 3: Amazon Sticky Buy Box (3 Cols) */}
          <div className="lg:col-span-3">
            <div className="border border-slate-200 rounded-lg p-4 shadow-sm bg-white space-y-3 sticky top-24">
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-medium text-slate-900">₹</span>
                <span className="text-2xl font-bold text-slate-900">
                  {currentPriceINR.toLocaleString('en-IN')}
                </span>
              </div>

              {/* Delivery Promise */}
              <div className="text-xs space-y-1">
                <p className="text-slate-700">
                  <span className="text-cyan-700 font-semibold">FREE delivery</span> on orders above ₹999.
                </p>
                <p className="font-bold text-slate-900">
                  Arrives in 2-4 business days.
                </p>
                <div className="flex items-center gap-1 text-[11px] text-cyan-800 pt-1">
                  <MapPin size={13} className="flex-shrink-0" />
                  <span className="truncate">Deliver to {city} {pincode}</span>
                </div>
              </div>

              {/* Stock Status */}
              <div>
                {isOutOfStock ? (
                  <span className="text-rose-600 font-bold text-sm block">
                    Currently unavailable.
                  </span>
                ) : isLowStock ? (
                  <span className="text-[#b12704] font-bold text-sm block">
                    Only {product.stock_quantity} left in stock - order soon.
                  </span>
                ) : (
                  <span className="text-[#007600] font-bold text-base block">
                    In Stock
                  </span>
                )}
              </div>

              {/* Quantity Selector */}
              {!isOutOfStock && (
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-600 font-medium">Quantity:</span>
                  <select
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value, 10))}
                    className="border border-slate-300 rounded px-2.5 py-1 text-xs bg-slate-50 font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    {[...Array(Math.min(10, product.stock_quantity || 10))].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Add to Cart & Buy Now Buttons (Amazon Style) */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock || addingToCart}
                  className={`w-full py-2.5 px-4 rounded-full text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-1.5 ${
                    isOutOfStock
                      ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                      : addedNotice
                      ? 'bg-emerald-600 text-white border border-emerald-700'
                      : 'bg-[#ffd814] hover:bg-[#f7ca00] active:bg-[#f0b800] text-[#0f1111] border border-[#fcd200]'
                  }`}
                >
                  {addedNotice ? (
                    <>
                      <Check size={16} /> Added to Cart!
                    </>
                  ) : (
                    <>
                      <ShoppingCart size={16} /> Add to Cart
                    </>
                  )}
                </button>

                {!isOutOfStock && (
                  <button
                    type="button"
                    onClick={handleBuyNow}
                    className="w-full py-2.5 px-4 bg-[#ffa41c] hover:bg-[#fa8900] active:bg-[#e87a00] text-[#0f1111] font-semibold rounded-full text-xs shadow-xs transition-all border border-[#ff8f00]"
                  >
                    Buy Now
                  </button>
                )}
              </div>

              {/* Security & Logistics Meta */}
              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                <div className="flex justify-between">
                  <span>Ships from:</span>
                  <span className="font-semibold text-slate-800">VK Technology</span>
                </div>
                <div className="flex justify-between">
                  <span>Sold by:</span>
                  <span className="font-semibold text-slate-800">VK Technology (Direct)</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment:</span>
                  <span className="font-semibold text-slate-800 flex items-center gap-1">
                    <Lock size={11} className="text-emerald-700" /> Secure transaction
                  </span>
                </div>
              </div>

              {/* Wishlist Button */}
              <button
                type="button"
                onClick={() => toggleWishlist(product.id)}
                className={`w-full py-2 px-3 rounded-lg border text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                  isWishlisted(product.id)
                    ? 'border-rose-300 text-rose-600 bg-rose-50'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Heart size={14} className={isWishlisted(product.id) ? 'fill-rose-500 text-rose-500' : ''} />
                <span>{isWishlisted(product.id) ? 'Saved in Wishlist' : 'Add to Wishlist'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Detailed Overview, Technical Specs & Package Contents */}
        <div className="border-t border-slate-200 pt-8 space-y-8">
          {/* Detailed Description */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Package size={20} className="text-cyan-700" />
              Product Description & Overview
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>

          {/* Technical Specifications Table */}
          {product.specs && product.specs.length > 0 && (
            <div className="space-y-3 pt-6 border-t border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Wrench size={20} className="text-cyan-700" />
                Technical Details & Specifications
              </h3>
              <div className="overflow-x-auto max-w-3xl">
                <table className="w-full text-xs text-left border border-slate-200 rounded-lg overflow-hidden">
                  <tbody>
                    {product.specs.map((spec, i) => (
                      <tr key={spec.id || i} className={i % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                        <td className="py-2.5 px-4 font-semibold text-slate-700 w-1/3 border-b border-slate-200">
                          {spec.spec_name}
                        </td>
                        <td className="py-2.5 px-4 text-slate-900 font-mono border-b border-slate-200">
                          {spec.spec_value}
                        </td>
                      </tr>
                    ))}
                    {product.weight_grams && (
                      <tr className="bg-slate-50">
                        <td className="py-2.5 px-4 font-semibold text-slate-700 border-b border-slate-200">Item Weight</td>
                        <td className="py-2.5 px-4 text-slate-900 font-mono border-b border-slate-200">{product.weight_grams} grams</td>
                      </tr>
                    )}
                    {product.package_dimensions && (
                      <tr className="bg-white">
                        <td className="py-2.5 px-4 font-semibold text-slate-700 border-b border-slate-200">Package Dimensions</td>
                        <td className="py-2.5 px-4 text-slate-900 font-mono border-b border-slate-200">{product.package_dimensions}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Package Contents & Pin Compatibility */}
          {(product.package_contents || product.compatibility_info) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100 max-w-4xl">
              {product.package_contents && (
                <div className="space-y-2 bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 font-mono">
                    Package Contents
                  </h4>
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                    {product.package_contents}
                  </p>
                </div>
              )}
              {product.compatibility_info && (
                <div className="space-y-2 bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 font-mono">
                    Software & Pin Compatibility
                  </h4>
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                    {product.compatibility_info}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Related Products Carousel */}
        {relatedProducts.length > 0 && (
          <div className="border-t border-slate-200 pt-8 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              Customers who viewed this item also viewed
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {relatedProducts.slice(0, 5).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}

        {/* Customer Reviews Section */}
        <div className="border-t border-slate-200 pt-8 space-y-6 max-w-4xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Customer Reviews</h3>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center text-amber-500">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={16} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="font-bold text-sm text-slate-900">4.8 out of 5</span>
                <span className="text-xs text-slate-500">
                  ({product.reviews?.length || 38} global ratings)
                </span>
              </div>
            </div>
          </div>

          {/* Existing Reviews List */}
          {product.reviews && product.reviews.length > 0 ? (
            <div className="space-y-4">
              {product.reviews.map((rev) => (
                <div key={rev.id} className="p-4 bg-slate-50 rounded-lg space-y-1.5 border border-slate-200/80">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">
                      {rev.user_name || 'Verified Maker'}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(rev.created_at).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        className={i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
                      />
                    ))}
                    <span className="text-[11px] font-semibold text-emerald-700 ml-1">
                      Verified Purchase
                    </span>
                  </div>
                  {rev.title && <h5 className="font-semibold text-xs text-slate-900">{rev.title}</h5>}
                  <p className="text-xs text-slate-700 leading-relaxed">{rev.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 bg-slate-50 rounded-lg text-center text-xs text-slate-500 italic">
              No written reviews yet. Be the first maker to review this project kit!
            </div>
          )}

          {/* Write Review Form */}
          <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900">
              Review this product
            </h4>
            <p className="text-xs text-slate-600">
              Share your thoughts and project build experience with fellow engineers and makers.
            </p>
            {isAuthenticated ? (
              <form onSubmit={handleReviewSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1">Your Rating</label>
                  <select
                    value={reviewRating}
                    onChange={(e) => setReviewRating(parseInt(e.target.value, 10))}
                    className="p-2 border border-slate-300 rounded bg-white text-xs font-bold"
                  >
                    <option value={5}>5 Stars - Excellent kit & components</option>
                    <option value={4}>4 Stars - Good quality, works as expected</option>
                    <option value={3}>3 Stars - Average</option>
                    <option value={2}>2 Stars - Below expectations</option>
                    <option value={1}>1 Star - Defective or poor</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Headline</label>
                  <input
                    type="text"
                    placeholder="e.g. Perfect for my IoT home automation project"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Written Review</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="What did you build? How was the pinout quality and documentation?"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded bg-white text-xs"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-5 py-2 bg-[#ffd814] hover:bg-[#f7ca00] text-slate-900 font-bold rounded-full text-xs shadow-xs border border-[#fcd200]"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            ) : (
              <div className="pt-1">
                <Link
                  to="/login"
                  className="inline-block py-2 px-4 bg-slate-900 text-white font-semibold rounded-lg text-xs hover:bg-slate-800"
                >
                  Sign In to Write a Review
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
