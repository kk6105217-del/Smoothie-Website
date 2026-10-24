import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Review } from '../../types';
import { StarRating } from '../../components/StarRating';
import {
  MessageSquare,
  CheckCircle,
  XCircle,
  Trash2,
  Filter,
  Search,
  AlertCircle,
  Clock,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminReviews: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await api.reviews.getAdminAll();
      setReviews(res.reviews || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load reviews.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleUpdateStatus = async (id: number, status: 'approved' | 'rejected' | 'pending') => {
    try {
      await api.reviews.updateStatus(id, status);
      setSuccess(`Review marked as ${status}.`);
      fetchReviews();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update review status.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to permanently delete this review?')) return;
    try {
      await api.reviews.delete(id);
      setSuccess('Review deleted.');
      fetchReviews();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete review.');
    }
  };

  const filteredReviews = reviews.filter((r) => {
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesSearch =
      (r.customer_name && r.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.comment && r.comment.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.product_name && r.product_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const pendingCount = reviews.filter((r) => r.status === 'pending').length;
  const approvedCount = reviews.filter((r) => r.status === 'approved').length;
  const rejectedCount = reviews.filter((r) => r.status === 'rejected').length;

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="text-amber-500" size={24} />
            Customer Reviews Moderation
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Approve or reject customer product feedback. Verified purchases and ratings directly recalculate product star averages.
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
          <span className="text-gray-500 block">Total Reviews</span>
          <span className="text-lg font-bold text-gray-900">{reviews.length}</span>
        </div>
        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
          <span className="text-yellow-600 block">Pending Review</span>
          <span className="text-lg font-bold text-yellow-700">{pendingCount}</span>
        </div>
        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
          <span className="text-green-600 block">Approved & Live</span>
          <span className="text-lg font-bold text-green-700">{approvedCount}</span>
        </div>
        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
          <span className="text-red-600 block">Rejected</span>
          <span className="text-lg font-bold text-red-700">{rejectedCount}</span>
        </div>
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
            <CheckCircle size={16} />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-green-500 font-bold">&times;</button>
        </div>
      )}

      {/* Search & Status Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between text-xs">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer, comment, or product..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-amber-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={15} className="text-gray-400" />
          <span className="font-semibold text-gray-700">Filter:</span>
          {(['all', 'pending', 'approved', 'rejected'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded font-semibold capitalize transition ${
                statusFilter === st
                  ? 'bg-amber-400 text-gray-950 font-bold shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews Table / Feed */}
      {loading ? (
        <div className="bg-white p-12 text-center rounded-lg border border-gray-200">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto" />
          <p className="text-xs text-gray-500 mt-2">Loading reviews...</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-lg border border-gray-200 space-y-2">
          <MessageSquare size={44} className="text-gray-300 mx-auto" />
          <h3 className="text-sm font-bold text-gray-800">No Reviews Match</h3>
          <p className="text-xs text-gray-500">
            No customer reviews found matching your current filter settings.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((rev) => {
            const isApproved = rev.status === 'approved';
            const isRejected = rev.status === 'rejected';
            const isPending = rev.status === 'pending';

            return (
              <div
                key={rev.id}
                className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-start text-xs"
              >
                {/* Content */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StarRating rating={rev.rating} size={14} />
                    <span className="font-bold text-gray-900 text-sm">
                      {rev.title || 'Product Feedback'}
                    </span>
                    {Boolean(rev.is_verified_purchase) && (
                      <span className="bg-amber-100 text-amber-900 font-bold text-[10px] px-2 py-0.5 rounded flex items-center gap-1">
                        <ShieldCheck size={11} />
                        Verified Purchase
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
                        isApproved
                          ? 'bg-green-100 text-green-800'
                          : isRejected
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {rev.status}
                    </span>
                  </div>

                  <p className="text-gray-700 leading-relaxed italic bg-gray-50 p-3 rounded border border-gray-100">
                    "{rev.comment}"
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-gray-500 text-[11px]">
                    <div>
                      By <strong className="text-gray-700">{rev.customer_name}</strong>
                    </div>
                    <div>
                      On {new Date(rev.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </div>
                    {rev.product_name && (
                      <div className="flex items-center gap-1">
                        <span>For:</span>
                        <Link
                          to={`/product/${rev.product_slug || rev.product_id}`}
                          target="_blank"
                          className="font-semibold text-blue-600 hover:underline flex items-center gap-0.5"
                        >
                          {rev.product_name}
                          <ExternalLink size={10} />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>

                {/* Moderation Controls */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  {!isApproved && (
                    <button
                      onClick={() => handleUpdateStatus(rev.id, 'approved')}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold px-3 py-1.5 rounded flex items-center gap-1 shadow-sm transition"
                    >
                      <CheckCircle size={13} />
                      Approve
                    </button>
                  )}

                  {!isRejected && (
                    <button
                      onClick={() => handleUpdateStatus(rev.id, 'rejected')}
                      className="bg-gray-200 hover:bg-red-100 text-gray-700 hover:text-red-700 font-semibold px-3 py-1.5 rounded flex items-center gap-1 transition"
                    >
                      <XCircle size={13} />
                      Reject
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(rev.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                    title="Delete permanently"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
