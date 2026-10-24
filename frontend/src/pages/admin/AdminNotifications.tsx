import React, { useEffect, useState } from 'react';
import { NotificationLog } from '../../types';
import { api } from '../../services/api';
import { FiBell, FiMail, FiMessageCircle, FiSmartphone, FiCheckCircle, FiXCircle, FiClock, FiRefreshCw } from 'react-icons/fi';

export const AdminNotifications: React.FC = () => {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [channelFilter, setChannelFilter] = useState<string>('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.admin.getNotifications(channelFilter || undefined);
      setLogs(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load notification logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [channelFilter]);

  const getChannelIcon = (channel: string) => {
    switch (channel.toUpperCase()) {
      case 'EMAIL':
        return <FiMail className="text-blue-500" />;
      case 'WHATSAPP':
        return <FiMessageCircle className="text-emerald-500" />;
      case 'SMS':
        return <FiSmartphone className="text-purple-500" />;
      default:
        return <FiBell className="text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notification Logs & Dispatch Audit</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track automated order confirmations, dispatch alerts, and delivery updates across Email, WhatsApp, and SMS.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchLogs}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            title="Refresh"
          >
            <FiRefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200 flex flex-wrap gap-2">
        <button
          onClick={() => setChannelFilter('')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
            channelFilter === '' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Channels
        </button>
        <button
          onClick={() => setChannelFilter('EMAIL')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
            channelFilter === 'EMAIL' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <FiMail className="w-3.5 h-3.5" /> Email Alerts
        </button>
        <button
          onClick={() => setChannelFilter('WHATSAPP')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
            channelFilter === 'WHATSAPP' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <FiMessageCircle className="w-3.5 h-3.5" /> WhatsApp Alerts
        </button>
        <button
          onClick={() => setChannelFilter('SMS')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
            channelFilter === 'SMS' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <FiSmartphone className="w-3.5 h-3.5" /> SMS Alerts
        </button>
      </div>

      {/* Notifications Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">Recipient</th>
                <th className="py-3 px-4">Template Event</th>
                <th className="py-3 px-4 text-center">Dispatch Status</th>
                <th className="py-3 px-4">Provider Message ID / Error</th>
                <th className="py-3 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    <FiRefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary-600" />
                    Loading notification logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    <FiBell className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                    No notifications recorded for this filter.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isSent = log.status.toUpperCase() === 'SENT';
                  const isFailed = log.status.toUpperCase() === 'FAILED';

                  return (
                    <tr key={log.id} className="hover:bg-gray-50 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {getChannelIcon(log.channel)}
                          <span className="font-semibold text-gray-900 text-xs uppercase">{log.channel}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-gray-800">
                        {log.recipient}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                          {log.template_key}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isSent ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                            <FiCheckCircle className="w-3.5 h-3.5" /> Delivered
                          </span>
                        ) : isFailed ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                            <FiXCircle className="w-3.5 h-3.5" /> Failed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                            <FiClock className="w-3.5 h-3.5" /> Pending
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs font-mono max-w-xs truncate">
                        {log.error_message ? (
                          <span className="text-red-600" title={log.error_message}>
                            {log.error_message}
                          </span>
                        ) : (
                          <span className="text-gray-500" title={log.provider_message_id}>
                            {log.provider_message_id || 'Mock Dispatch [OK]'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-xs text-gray-500">
                        {new Date(log.created_at).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
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
