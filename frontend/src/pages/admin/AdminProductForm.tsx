import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Upload,
  CheckCircle2,
  AlertCircle,
  Package,
  ExternalLink,
  Archive,
  Save,
  Send,
  Sparkles,
} from 'lucide-react';
import { Category, ProductSpec, ProductImage } from '../../types';
import { api } from '../../services/api';

export const AdminProductForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id && id !== 'new';
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [slug, setSlug] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brand, setBrand] = useState('VK Technology');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [features, setFeatures] = useState('');
  const [priceINR, setPriceINR] = useState('');
  const [salePriceINR, setSalePriceINR] = useState('');
  const [stockQuantity, setStockQuantity] = useState('10');
  const [lowStockThreshold, setLowStockThreshold] = useState('5');
  const [isPublished, setIsPublished] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [weightGrams, setWeightGrams] = useState('');
  const [packageDimensions, setPackageDimensions] = useState('');
  const [packageContents, setPackageContents] = useState('');
  const [compatibilityInfo, setCompatibilityInfo] = useState('');
  const [warrantyInfo, setWarrantyInfo] = useState('6 Months Manufacturing Warranty');
  const [returnEligible, setReturnEligible] = useState(true);

  // Specs & Images
  const [specs, setSpecs] = useState<Array<{ spec_name: string; spec_value: string }>>([
    { spec_name: '', spec_value: '' },
  ]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [images, setImages] = useState<Array<{ image_url: string; alt_text?: string; sort_order: number }>>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    async function loadInitial() {
      try {
        const cats = await api.admin.listCategories();
        setCategories(cats);
        if (cats.length > 0 && !categoryId) {
          setCategoryId(cats[0].id);
        }

        if (isEditing) {
          const prod = await api.getProduct(id!);
          setName(prod.name);
          setSku(prod.sku);
          setSlug(prod.slug);
          setCategoryId(prod.category_id || (cats[0]?.id || ''));
          setBrand(prod.brand || 'VK Technology');
          setShortDescription(prod.short_description || '');
          setDescription(prod.description);
          setFeatures(prod.features || '');
          setPriceINR((prod.price / 100).toString());
          setSalePriceINR(prod.sale_price ? (prod.sale_price / 100).toString() : '');
          setStockQuantity(prod.stock_quantity.toString());
          setLowStockThreshold(prod.low_stock_threshold.toString());
          setIsPublished(prod.is_published);
          setIsFeatured(prod.is_featured);
          setWeightGrams(prod.weight_grams ? prod.weight_grams.toString() : '');
          setPackageDimensions(prod.package_dimensions || '');
          setPackageContents(prod.package_contents || '');
          setCompatibilityInfo(prod.compatibility_info || '');
          setWarrantyInfo(prod.warranty_info || '6 Months Manufacturing Warranty');
          setReturnEligible(prod.return_eligible);

          if (prod.specs && prod.specs.length > 0) {
            setSpecs(prod.specs.map((s) => ({ spec_name: s.spec_name, spec_value: s.spec_value })));
          }
          if (prod.images && prod.images.length > 0) {
            setImages(
              prod.images.map((img, i) => ({
                image_url: img.image_url,
                alt_text: img.alt_text,
                sort_order: img.sort_order || i,
              }))
            );
          }
        }
      } catch (err: any) {
        setErrorNotice(err.message || 'Failed to initialize form');
      } finally {
        setLoading(false);
      }
    }
    loadInitial();
  }, [id, isEditing]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    try {
      if (isEditing && id) {
        // Direct upload to product images endpoint
        const updatedProd = await api.admin.uploadProductImages(id, files);
        if (updatedProd.images) {
          setImages(
            updatedProd.images.map((img, i) => ({
              image_url: img.image_url,
              alt_text: img.alt_text,
              sort_order: img.sort_order || i,
            }))
          );
        }
      } else {
        // Individual uploads via admin upload endpoint
        const newImages: Array<{ image_url: string; alt_text?: string; sort_order: number }> = [];
        for (let i = 0; i < files.length; i++) {
          const res = await api.admin.uploadImage(files[i]);
          newImages.push({
            image_url: res.url,
            alt_text: name || 'Product image',
            sort_order: images.length + i,
          });
        }
        setImages((prev) => [...prev, ...newImages]);
      }
    } catch (err: any) {
      alert(err.message || 'Image upload failed');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    setImages([
      ...images,
      { image_url: imageUrlInput.trim(), alt_text: name || 'Product image', sort_order: images.length },
    ]);
    setImageUrlInput('');
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleAddSpecRow = () => {
    setSpecs([...specs, { spec_name: '', spec_value: '' }]);
  };

  const handleRemoveSpecRow = (index: number) => {
    setSpecs(specs.filter((_, i) => i !== index));
  };

  const handleSpecChange = (index: number, field: 'spec_name' | 'spec_value', value: string) => {
    const updated = [...specs];
    updated[index][field] = value;
    setSpecs(updated);
  };

  const executeSave = async (publishOverride?: boolean) => {
    setErrorNotice(null);
    setSuccessNotice(null);
    setSaving(true);

    try {
      const pricePaise = Math.round(parseFloat(priceINR) * 100);
      const salePricePaise = salePriceINR ? Math.round(parseFloat(salePriceINR) * 100) : null;

      if (isNaN(pricePaise) || pricePaise <= 0) {
        throw new Error('Please enter a valid regular price in INR.');
      }

      if (!name.trim()) {
        throw new Error('Product title is required.');
      }

      if (!sku.trim()) {
        throw new Error('Product SKU is required.');
      }

      if (!description.trim()) {
        throw new Error('Product description is required.');
      }

      const validSpecs = specs.filter((s) => s.spec_name.trim() && s.spec_value.trim());
      const publishState = publishOverride !== undefined ? publishOverride : isPublished;

      const payload = {
        name: name.trim(),
        sku: sku.trim().toUpperCase(),
        category_id: categoryId || undefined,
        brand: brand.trim() || undefined,
        short_description: shortDescription.trim() || undefined,
        description: description.trim(),
        features: features.trim() || undefined,
        price: pricePaise,
        sale_price: salePricePaise,
        stock_quantity: parseInt(stockQuantity, 10) || 0,
        low_stock_threshold: parseInt(lowStockThreshold, 10) || 5,
        is_published: publishState,
        is_featured: isFeatured,
        weight_grams: weightGrams ? parseInt(weightGrams, 10) : undefined,
        package_dimensions: packageDimensions.trim() || undefined,
        package_contents: packageContents.trim() || undefined,
        compatibility_info: compatibilityInfo.trim() || undefined,
        warranty_info: warrantyInfo.trim() || undefined,
        return_eligible: returnEligible,
        images,
        specs: validSpecs,
      };

      if (isEditing) {
        const updated = await api.admin.updateProduct(id!, payload);
        setIsPublished(updated.is_published);
        setSlug(updated.slug);
        setSuccessNotice(`Product updated successfully! Status: ${updated.is_published ? 'PUBLISHED' : 'DRAFT'}`);
      } else {
        const created = await api.admin.createProduct(payload);
        navigate(`/admin/products/${created.id}/edit`);
      }
    } catch (err: any) {
      setErrorNotice(err.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!isEditing || !id) return;
    if (!window.confirm(`Archive "${name}"? This removes it from public storefront while preserving past order records.`)) {
      return;
    }
    setSaving(true);
    try {
      await api.admin.archiveProduct(id);
      navigate('/admin/products');
    } catch (err: any) {
      setErrorNotice(err.message || 'Failed to archive product');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/products"
            className="p-2 text-slate-500 hover:text-slate-900 bg-white border border-slate-200 rounded-lg transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {isEditing ? `Edit Product: ${sku}` : 'Add New Product'}
              </h1>
              {isEditing && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {isPublished ? 'PUBLISHED' : 'DRAFT'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-mono">
              VK Technology · DIY Tech Projects Catalog
            </p>
          </div>
        </div>

        {/* Action Buttons Top Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          {isEditing && slug && (
            <a
              href={`/products/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
              title="Preview product in storefront"
            >
              <ExternalLink size={14} /> Preview Product
            </a>
          )}
          {isEditing && (
            <button
              type="button"
              onClick={handleArchive}
              disabled={saving}
              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
              title="Archive product"
            >
              <Archive size={14} /> Archive
            </button>
          )}
          <button
            type="button"
            onClick={() => executeSave(false)}
            disabled={saving}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Save size={14} /> Save as Draft
          </button>
          <button
            type="button"
            onClick={() => executeSave(true)}
            disabled={saving}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Send size={14} /> Publish Product
          </button>
        </div>
      </div>

      {errorNotice && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
          <AlertCircle size={18} className="flex-shrink-0" />
          <span>{errorNotice}</span>
        </div>
      )}

      {successNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 size={18} className="flex-shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          executeSave();
        }}
        className="space-y-6 text-xs"
      >
        {/* Basic Details */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2 flex items-center gap-2">
            <Package size={16} className="text-cyan-600" />
            Basic Product Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Product Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. ESP32-S3 AI IoT Development Kit"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500 font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Product SKU *</label>
              <input
                type="text"
                required
                placeholder="e.g. VK-ESP32-S3-AI-KIT"
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono uppercase focus:bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500 font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Product Category *</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Brand</label>
              <input
                type="text"
                placeholder="VK Technology"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Short Description (Summary)</label>
              <input
                type="text"
                placeholder="Brief one-sentence description for cards and search"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Full Description *</label>
              <textarea
                required
                rows={5}
                placeholder="Comprehensive technical details, project overview, usage guidelines..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:outline-none"
              />
            </div>

            {/* Product Features */}
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Sparkles size={14} className="text-cyan-600" />
                Product Features & Key Highlights
              </label>
              <textarea
                rows={4}
                placeholder="• Dual-core 240MHz Xtensa LX7 MCU&#10;• Integrated 2.4GHz Wi-Fi 4 and Bluetooth 5 LE&#10;• On-board camera sensor interface and OLED support&#10;• Complete DIY sample code and documentation included"
                value={features}
                onChange={(e) => setFeatures(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white focus:outline-none font-mono text-xs"
              />
              <p className="text-[11px] text-slate-400 mt-1">Enter key bullet points or feature highlights to show on the product page.</p>
            </div>
          </div>
        </div>

        {/* Pricing & Inventory */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
            Pricing & Stock Availability
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Regular Price (INR ₹) *</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="1899.00"
                value={priceINR}
                onChange={(e) => setPriceINR(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Discount / Sale Price (₹)</label>
              <input
                type="number"
                step="0.01"
                placeholder="1599.00"
                value={salePriceINR}
                onChange={(e) => setSalePriceINR(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono text-emerald-700"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Available Stock Quantity *</label>
              <input
                type="number"
                required
                min="0"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Low-Stock Alert Level</label>
              <input
                type="number"
                min="0"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 w-4 h-4"
              />
              <span className="font-semibold text-slate-800">
                Product Status: {isPublished ? 'Published (Visible in store)' : 'Draft (Hidden from store)'}
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 w-4 h-4"
              />
              <span className="font-semibold text-slate-800">Feature on Homepage</span>
            </label>
          </div>
        </div>

        {/* Product Images (Upload Multiple) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-bold text-slate-900 text-sm">Product Images</h3>
            <span className="text-[11px] text-slate-400 font-mono">{images.length} images uploaded</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Paste direct image URL (https://...)"
              value={imageUrlInput}
              onChange={(e) => setImageUrlInput(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2.5"
            />
            <button
              type="button"
              onClick={handleAddImageUrl}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-cyan-600 transition-colors"
            >
              Add URL
            </button>
            <label className="px-4 py-2 bg-slate-100 border border-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-200 cursor-pointer flex items-center justify-center gap-1.5 transition-colors">
              <Upload size={14} />
              {uploadingImage ? 'Uploading...' : 'Upload Images (Multiple)'}
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploadingImage}
              />
            </label>
          </div>

          {images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-2">
              {images.map((img, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group bg-slate-50">
                  <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(i)}
                    className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-md shadow-xs opacity-80 hover:opacity-100 transition-opacity"
                    title="Remove Image"
                  >
                    <Trash2 size={12} />
                  </button>
                  {i === 0 && (
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-slate-900/80 text-white text-[9px] font-bold rounded">
                      Primary
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Technical Specifications */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-bold text-slate-900 text-sm">Technical Specifications</h3>
            <button
              type="button"
              onClick={handleAddSpecRow}
              className="px-3 py-1 bg-slate-100 hover:bg-cyan-50 text-cyan-800 rounded-md font-bold text-[11px] flex items-center gap-1 transition-colors"
            >
              <Plus size={12} /> Add Spec Row
            </button>
          </div>

          <div className="space-y-2">
            {specs.map((row, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Specification Name (e.g. Operating Voltage)"
                  value={row.spec_name}
                  onChange={(e) => handleSpecChange(i, 'spec_name', e.target.value)}
                  className="w-1/3 bg-slate-50 border border-slate-200 rounded-lg p-2"
                />
                <input
                  type="text"
                  placeholder="Specification Value (e.g. 3.3V - 5V DC)"
                  value={row.spec_value}
                  onChange={(e) => handleSpecChange(i, 'spec_value', e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2"
                />
                {specs.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveSpecRow(i)}
                    className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Package Contents & Shipping Weight */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
            Package Contents & Shipping Dimensions
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Package Contents</label>
              <textarea
                rows={3}
                placeholder="1x Development Board, 1x USB Cable, 1x Acrylic Case, 1x Pinout Chart"
                value={packageContents}
                onChange={(e) => setPackageContents(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Hardware & Software Compatibility</label>
              <textarea
                rows={3}
                placeholder="Arduino IDE, ESP-IDF, MicroPython, CircuitPython"
                value={compatibilityInfo}
                onChange={(e) => setCompatibilityInfo(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Shipping Weight (in Grams)</label>
              <input
                type="number"
                placeholder="150"
                value={weightGrams}
                onChange={(e) => setWeightGrams(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Package Dimensions</label>
              <input
                type="text"
                placeholder="18 x 12 x 3 cm"
                value={packageDimensions}
                onChange={(e) => setPackageDimensions(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
              />
            </div>
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
          <div>
            {isEditing && (
              <button
                type="button"
                onClick={handleArchive}
                disabled={saving}
                className="px-4 py-2.5 text-rose-600 hover:bg-rose-50 font-bold rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Archive size={15} /> Archive Product
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/admin/products"
              className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 font-bold rounded-xl transition-colors"
            >
              Cancel
            </Link>
            <button
              type="button"
              onClick={() => executeSave(false)}
              disabled={saving}
              className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <Save size={15} /> Save as Draft
            </button>
            <button
              type="button"
              onClick={() => executeSave(true)}
              disabled={saving}
              className="px-6 py-2.5 bg-slate-900 hover:bg-cyan-600 text-white font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              <Send size={15} /> {saving ? 'Saving...' : 'Publish Product'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
