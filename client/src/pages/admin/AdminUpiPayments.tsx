import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { UpiPayment } from '../../types';
import {
  QrCode,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  ExternalLink,
  Copy,
  Check,
  Eye,
  AlertCircle,
  FileText,
  ShieldCheck,
  RefreshCw,
  X,
  MessageSquare,
  ArrowRight
} from 'lucide-react';

export const AdminUpiPayments: React.FC = () => {
  const [payments, setPayments] = useState<UpiPayment[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [upiConfig, setUpiConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pending Verification' | 'Approved' | 'Rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const [rejectingPayment, setRejectingPayment] = useState<UpiPayment | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Payment reference / UTR not found in bank statement');
  const [rejectionNote, setRejectionNote] = useState('');
  const [editingNotePayment, setEditingNotePayment] = useState<UpiPayment | null>(null);
  const [noteText, setNoteText] = useState('');
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [res, cfg] = await Promise.all([
        api.upi.getAdminAll(),
        api.upi.getConfig()
      ]);
      setPayments(res.payments || []);
      setStats(res.stats || null);
      setUpiConfig(cfg);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load UPI transactions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCopyUtr = (utr: string) => {
    navigator.clipboard.writeText(utr);
    setCopiedUtr(utr);
    setTimeout(() => setCopiedUtr(null), 2000);
  };

  const handleApprove = async (payment: UpiPayment) => {
    if (!window.confirm(`Verify and approve payment of ₹${payment.amount} for Order #${payment.order_number}? This will mark the order as Paid and Confirmed.`)) {
      return;
    }

    try {
      await api.upi.approve(payment.id);
      setSuccess(`Payment for Order #${payment.order_number} verified and approved successfully!`);
      loadData();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to approve payment.');
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingPayment) return;

    try {
      await api.upi.reject(rejectingPayment.id, rejectionReason, rejectionNote);
      setSuccess(`Payment for Order #${rejectingPayment.order_number} rejected.`);
      setRejectingPayment(null);
      setRejectionNote('');
      loadData();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to reject payment.');
    }
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNotePayment) return;

    try {
      await api.upi.updateNote(editingNotePayment.id, noteText);
      setSuccess('Internal note updated.');
      setEditingNotePayment(null);
      loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save note.');
    }
  };

  const handleViewAuditLogs = async () => {
    try {
      const res = await api.upi.getAuditLogs();
      setAuditLogs(res.logs || []);
      setShowAuditLogs(true);
    } catch (e) {
      alert('Failed to load audit logs.');
    }
  };

  const filteredPayments = payments.filter((p) => {
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      p.order_number.toLowerCase().includes(q) ||
      p.utr_number.toLowerCase().includes(q) ||
      p.customer_name.toLowerCase().includes(q) ||
      (p.customer_phone && p.customer_phone.includes(q));
    return matchesStatus && matchesSearch;
  });

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <QrCode className="text-amber-500" size={24} />
            UPI QR Code Payments & Verification
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manual transaction verification center. Verify customer UTR references and screenshot evidence before marking orders as paid.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleViewAuditLogs}
            className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-semibold px-3 py-2 rounded text-xs flex items-center gap-1.5 shadow-sm transition"
          >
            <ShieldCheck size={14} className="text-blue-600" />
            Decision Audit Trail
          </button>
          <Link
            to="/admin/settings"
            className="bg-amber-400 hover:bg-amber-500 text-gray-950 font-bold px-4 py-2 rounded text-xs flex items-center gap-1.5 shadow-sm transition"
          >
            Configure UPI QR & VPA
          </Link>
        </div>
      </div>

      {/* Active UPI Configuration Banner */}
      {upiConfig && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 text-xs text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <QrCode size={18} className="text-amber-600 shrink-0" />
            <span>
              <strong>Active UPI Payee:</strong> {upiConfig.payee_name} • <strong>UPI ID:</strong>{' '}
              <span className="font-mono bg-white px-2 py-0.5 rounded border border-amber-300">{upiConfig.upi_id}</span> •{' '}
              <strong>Owner WhatsApp:</strong> <span className="font-mono">{upiConfig.owner_whatsapp}</span>
            </span>
          </div>
          <span className={`px-2 py-0.5 rounded text-[11px] font-bold self-start sm:self-auto ${
            upiConfig.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {upiConfig.enabled ? 'Payments Enabled' : 'Payments Paused'}
          </span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <span className="text-gray-500 block">Total Submissions</span>
          <span className="text-xl font-bold text-gray-900 mt-1 block">
            {stats?.total_count || 0}
          </span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-amber-200 bg-amber-50/40 shadow-sm">
          <span className="text-amber-700 font-bold block flex items-center gap-1">
            <Clock size={13} /> Pending Verification
          </span>
          <span className="text-2xl font-black text-amber-800 mt-1 block">
            {stats?.pending_count || 0}
          </span>
          <span className="text-[10px] text-amber-600 mt-0.5 block">Requires bank check</span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-green-200 bg-green-50/40 shadow-sm">
          <span className="text-green-700 font-bold block flex items-center gap-1">
            <CheckCircle2 size={13} /> Verified & Paid
          </span>
          <span className="text-2xl font-black text-green-800 mt-1 block">
            {stats?.approved_count || 0}
          </span>
          <span className="text-[10px] text-green-600 mt-0.5 block">
            {formatPrice(stats?.approved_amount || 0)} realized
          </span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-red-200 bg-red-50/40 shadow-sm">
          <span className="text-red-700 font-bold block flex items-center gap-1">
            <XCircle size={13} /> Rejected
          </span>
          <span className="text-2xl font-black text-red-800 mt-1 block">
            {stats?.rejected_count || 0}
          </span>
          <span className="text-[10px] text-red-600 mt-0.5 block">Invalid UTR / Mismatch</span>
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
            <CheckCircle2 size={16} />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-green-500 font-bold">&times;</button>
        </div>
      )}

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between text-xs">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order ID, UTR, customer..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-amber-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          <Filter size={15} className="text-gray-400 mr-1" />
          <span className="font-semibold text-gray-700">Filter:</span>
          {(['all', 'Pending Verification', 'Approved', 'Rejected'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded font-semibold whitespace-nowrap transition ${
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

      {/* UPI Transactions Table */}
      {loading ? (
        <div className="bg-white p-12 text-center rounded-lg border border-gray-200">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto" />
          <p className="text-xs text-gray-500 mt-2">Loading UPI transactions...</p>
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-lg border border-gray-200 space-y-2">
          <QrCode size={44} className="text-gray-300 mx-auto" />
          <h3 className="text-sm font-bold text-gray-800">No UPI Payments Found</h3>
          <p className="text-xs text-gray-500">
            No UPI QR transactions match your current search or filter.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 font-semibold uppercase tracking-wider text-[10px] border-b">
                <tr>
                  <th className="px-4 py-3">Order Details</th>
                  <th className="px-4 py-3">Customer Info</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">UTR / Transaction Ref</th>
                  <th className="px-4 py-3 text-center">Payment Evidence</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Verification Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPayments.map((p) => {
                  const isPending = p.status === 'Pending Verification';
                  const isApproved = p.status === 'Approved';
                  const isRejected = p.status === 'Rejected';

                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition">
                      {/* Order info */}
                      <td className="px-4 py-3.5">
                        <Link
                          to={`/orders/${p.order_id}`}
                          target="_blank"
                          className="font-bold text-blue-600 hover:underline flex items-center gap-1 font-mono"
                        >
                          {p.order_number}
                          <ExternalLink size={11} />
                        </Link>
                        <span className="text-[11px] text-gray-400 block mt-0.5">
                          {new Date(p.created_at).toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </td>

                      {/* Customer info */}
                      <td className="px-4 py-3.5">
                        <strong className="text-gray-900 block">{p.customer_name}</strong>
                        {p.customer_phone && (
                          <span className="text-[11px] text-gray-500 block font-mono">
                            {p.customer_phone}
                          </span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3.5 font-bold text-gray-900 text-sm">
                        {formatPrice(p.amount)}
                      </td>

                      {/* UTR */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-[11px]">
                            {p.utr_number}
                          </span>
                          <button
                            onClick={() => handleCopyUtr(p.utr_number)}
                            className="p-1 text-gray-400 hover:text-gray-700 rounded transition"
                            title="Copy UTR number"
                          >
                            {copiedUtr === p.utr_number ? (
                              <Check size={13} className="text-green-600" />
                            ) : (
                              <Copy size={13} />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Screenshot Evidence */}
                      <td className="px-4 py-3.5 text-center">
                        {p.screenshot_url ? (
                          <button
                            onClick={() => setSelectedScreenshot(p.screenshot_url!)}
                            className="inline-block relative group"
                            title="Click to view full screenshot"
                          >
                            <img
                              src={p.screenshot_url}
                              alt="Payment Screenshot"
                              className="w-12 h-12 object-cover rounded border border-gray-300 shadow-sm group-hover:scale-105 transition"
                            />
                            <div className="absolute inset-0 bg-black/40 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white">
                              <Eye size={14} />
                            </div>
                          </button>
                        ) : (
                          <span className="text-[10px] text-gray-400 italic">No image</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 font-bold px-2.5 py-0.5 rounded text-[11px] ${
                            isApproved
                              ? 'bg-green-100 text-green-800'
                              : isRejected
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-900 animate-pulse'
                          }`}
                        >
                          {isApproved && <CheckCircle2 size={12} />}
                          {isRejected && <XCircle size={12} />}
                          {isPending && <Clock size={12} />}
                          {p.status}
                        </span>
                        {p.admin_notes && (
                          <p className="text-[10px] text-gray-500 mt-1 italic max-w-xs line-clamp-1">
                            Note: {p.admin_notes}
                          </p>
                        )}
                      </td>

                      {/* Verification Controls */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && (
                            <>
                              <button
                                onClick={() => handleApprove(p)}
                                className="bg-green-600 hover:bg-green-700 text-white font-bold px-3 py-1.5 rounded text-xs flex items-center gap-1 shadow-sm transition"
                                title="Verify transaction and approve"
                              >
                                <CheckCircle2 size={13} />
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  setRejectingPayment(p);
                                  setRejectionReason('Payment reference / UTR not found in bank statement');
                                }}
                                className="bg-red-50 hover:bg-red-100 text-red-700 font-semibold px-2.5 py-1.5 rounded text-xs flex items-center gap-1 border border-red-200 transition"
                                title="Reject transaction"
                              >
                                <XCircle size={13} />
                                Reject
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => {
                              setEditingNotePayment(p);
                              setNoteText(p.admin_notes || '');
                            }}
                            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition"
                            title="Add internal note"
                          >
                            <MessageSquare size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Screenshot Lightbox Modal */}
      {selectedScreenshot && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative max-w-3xl max-h-[90vh] bg-white rounded-lg p-2 shadow-2xl flex flex-col items-center">
            <button
              onClick={() => setSelectedScreenshot(null)}
              className="absolute -top-3 -right-3 bg-red-600 text-white rounded-full p-1.5 shadow hover:bg-red-700"
            >
              <X size={18} />
            </button>
            <img
              src={selectedScreenshot}
              alt="Payment Evidence Screenshot"
              className="max-h-[80vh] w-auto object-contain rounded"
            />
            <div className="pt-2 text-xs text-gray-500">
              Customer Payment Evidence • Verify UTR & Timestamp
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectingPayment && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-red-600 flex items-center gap-1.5">
                <XCircle size={18} />
                Reject UPI Payment - Order #{rejectingPayment.order_number}
              </h3>
              <button onClick={() => setRejectingPayment(null)} className="text-gray-400 hover:text-gray-600 font-bold text-lg">
                &times;
              </button>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-3">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Select Rejection Reason *</label>
                <select
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-1 focus:ring-red-500 focus:outline-none"
                >
                  <option value="Payment reference / UTR not found in bank statement">Payment reference / UTR not found in bank statement</option>
                  <option value="Amount paid does not match order payable amount">Amount paid does not match order payable amount</option>
                  <option value="Duplicate or already used UTR transaction reference">Duplicate or already used UTR transaction reference</option>
                  <option value="Payment screenshot is invalid or unreadable">Payment screenshot is invalid or unreadable</option>
                  <option value="Other verification discrepancy">Other verification discrepancy</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Additional Internal Notes</label>
                <textarea
                  rows={3}
                  value={rejectionNote}
                  onChange={(e) => setRejectionNote(e.target.value)}
                  placeholder="Optional details for the customer or internal record..."
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-1 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setRejectingPayment(null)}
                  className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded shadow"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Internal Note Modal */}
      {editingNotePayment && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-gray-900">
                Internal Note - Order #{editingNotePayment.order_number}
              </h3>
              <button onClick={() => setEditingNotePayment(null)} className="text-gray-400 hover:text-gray-600 font-bold text-lg">
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveNote} className="space-y-3">
              <textarea
                rows={4}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Write private transaction verification notes..."
                className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setEditingNotePayment(null)}
                  className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-400 hover:bg-amber-500 text-gray-950 font-bold px-4 py-2 rounded shadow"
                >
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Decision Audit Trail Drawer / Modal */}
      {showAuditLogs && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 space-y-4 text-xs max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                <ShieldCheck size={18} className="text-blue-600" />
                Administrative Decision Audit Trail
              </h3>
              <button onClick={() => setShowAuditLogs(false)} className="text-gray-400 hover:text-gray-600 font-bold text-lg">
                &times;
              </button>
            </div>

            {auditLogs.length === 0 ? (
              <p className="text-gray-500 py-6 text-center">No decision logs recorded yet.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {auditLogs.map((log: any) => (
                  <div key={log.id} className="py-2.5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900 capitalize font-mono text-[11px]">
                        {log.action.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(log.created_at).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <p className="text-gray-600">{log.details}</p>
                    <span className="text-[10px] text-gray-400 block font-mono">
                      By: {log.admin_email}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-3 border-t">
              <button
                onClick={() => setShowAuditLogs(false)}
                className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded font-semibold text-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
