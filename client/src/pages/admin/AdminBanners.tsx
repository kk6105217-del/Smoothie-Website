import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Banner } from '../../types';
import {
  Image as ImageIcon,
  Plus,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Upload,
  ArrowUpDown,
  AlertCircle
} from 'lucide-react';

export const AdminBanners: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    image_url: '',
    link_url: '/products',
    button_text: 'Shop Now',
    display_order: 0,
    is_active: true
  });

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const res = await api.banners.getAdminAll();
      setBanners(res.banners || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load banners.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleOpenAdd = () => {
    setEditingBanner(null);
    setFormData({
      title: 'Build Your Ideas with VK Technology',
      subtitle: 'Explore DIY Electronics, Robotics, IoT Components and Innovative Project Kits.',
      image_url: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?auto=format&fit=crop&w=1600&q=80',
      link_url: '/products',
      button_text: 'Shop Now',
      display_order: banners.length,
      is_active: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle || '',
      image_url: banner.image_url,
      link_url: banner.link_url || '/products',
      button_text: banner.button_text || 'Shop Now',
      display_order: banner.display_order,
      is_active: Boolean(banner.is_active)
    });
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const uploadRes = await api.upload.single(file);
      setFormData(prev => ({ ...prev, image_url: uploadRes.url }));
      setSuccess('Banner image uploaded successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.image_url.trim()) {
      setError('Title and image URL are required.');
      return;
    }

    try {
      if (editingBanner) {
        await api.banners.update(editingBanner.id, formData);
        setSuccess('Banner updated successfully!');
      } else {
        await api.banners.create(formData);
        setSuccess('New banner created successfully!');
      }
      setIsModalOpen(false);
      fetchBanners();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Operation failed.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) return;
    try {
      await api.banners.delete(id);
      setSuccess('Banner removed successfully.');
      fetchBanners();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete banner.');
    }
  };

  const handleToggleActive = async (banner: Banner) => {
    try {
      await api.banners.update(banner.id, {
        ...banner,
        is_active: !banner.is_active
      });
      fetchBanners();
    } catch (err: any) {
      setError(err.message || 'Failed to toggle banner status.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ImageIcon className="text-amber-500" size={24} />
            Homepage Hero Banners
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage carousel banners displayed on the VK Technology storefront hero section.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-amber-400 hover:bg-amber-500 text-gray-950 font-bold px-4 py-2 rounded text-xs flex items-center gap-1.5 shadow-sm transition"
        >
          <Plus size={16} />
          Add New Banner
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 font-bold">&times;</button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-green-500 font-bold">&times;</button>
        </div>
      )}

      {/* Banners Grid / List */}
      {loading ? (
        <div className="bg-white p-12 text-center rounded-lg border border-gray-200">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto" />
          <p className="text-xs text-gray-500 mt-2">Loading hero banners...</p>
        </div>
      ) : banners.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-lg border border-gray-200 space-y-3">
          <ImageIcon size={48} className="text-gray-300 mx-auto" />
          <h3 className="text-sm font-bold text-gray-800">No Banners Found</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            You have not configured any hero banners yet. Add your first banner to highlight DIY robotics, IoT components, or student kits.
          </p>
          <button
            onClick={handleOpenAdd}
            className="bg-amber-400 hover:bg-amber-500 text-gray-950 font-bold px-4 py-2 rounded text-xs inline-flex items-center gap-1.5"
          >
            <Plus size={14} /> Add First Banner
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {banners.map((banner, index) => {
            const isActive = Boolean(banner.is_active);
            return (
              <div
                key={banner.id}
                className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col justify-between"
              >
                {/* Banner Preview Frame */}
                <div className="relative h-48 bg-gray-900 group overflow-hidden">
                  <img
                    src={banner.image_url}
                    alt={banner.title}
                    className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-black/40 to-transparent flex flex-col justify-end p-4 text-white">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-1">
                      Banner #{index + 1} • Order: {banner.display_order}
                    </span>
                    <h3 className="font-extrabold text-base leading-tight drop-shadow">{banner.title}</h3>
                    {banner.subtitle && (
                      <p className="text-xs text-gray-300 line-clamp-1 mt-0.5">{banner.subtitle}</p>
                    )}
                  </div>
                  {/* Status Badge */}
                  <span
                    className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded shadow ${
                      isActive ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-200'
                    }`}
                  >
                    {isActive ? 'Active' : 'Disabled'}
                  </span>
                </div>

                {/* Banner Details & Meta */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between text-xs">
                  <div className="space-y-1.5 text-gray-600">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-500">Destination:</span>
                      <a
                        href={banner.link_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1 font-mono text-[11px]"
                      >
                        {banner.link_url}
                        <ExternalLink size={11} />
                      </a>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-500">Call to Action:</span>
                      <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded font-medium">
                        {banner.button_text || 'Shop Now'}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <button
                      onClick={() => handleToggleActive(banner)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded transition ${
                        isActive
                          ? 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                          : 'bg-green-50 text-green-800 hover:bg-green-100'
                      }`}
                    >
                      {isActive ? 'Unpublish' : 'Publish to Store'}
                    </button>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleOpenEdit(banner)}
                        className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition"
                        title="Edit Banner"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(banner.id)}
                        className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition"
                        title="Delete Banner"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-sm font-bold text-gray-900">
                {editingBanner ? 'Edit Homepage Banner' : 'Create New Homepage Banner'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Banner Headline *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Build Your Ideas with VK Technology"
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Subtitle / Tagline
                </label>
                <textarea
                  rows={2}
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="e.g. Explore DIY Electronics, Robotics, IoT Components and Innovative Project Kits."
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Banner Image URL & File Upload */}
              <div className="space-y-2">
                <label className="block font-semibold text-gray-700">Banner Image URL *</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    required
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://... or upload below"
                    className="flex-1 border border-gray-300 rounded px-3 py-2 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                  <label className="bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 px-3 py-2 rounded cursor-pointer font-semibold flex items-center gap-1.5 shrink-0">
                    <Upload size={14} />
                    <span>{uploadingImage ? 'Uploading...' : 'Upload'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                  </label>
                </div>
                {formData.image_url && (
                  <div className="mt-2 h-32 rounded border border-gray-200 overflow-hidden bg-gray-100">
                    <img
                      src={formData.image_url}
                      alt="Banner Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Destination URL</label>
                  <input
                    type="text"
                    value={formData.link_url}
                    onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                    placeholder="/products or /category/robotics"
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Button Text</label>
                  <input
                    type="text"
                    value={formData.button_text}
                    onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                    placeholder="Shop Now"
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Display Sort Order</label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div className="pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="rounded text-amber-500 focus:ring-amber-400 h-4 w-4"
                    />
                    <span className="font-semibold text-gray-800">Publish immediately to store</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-400 hover:bg-amber-500 text-gray-950 font-bold px-5 py-2 rounded shadow transition"
                >
                  {editingBanner ? 'Save Changes' : 'Create Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
